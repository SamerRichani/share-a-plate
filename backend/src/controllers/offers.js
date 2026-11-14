const pool = require('../config/db');

const fields = ['title', 'description', 'category', 'area', 'location', 'quantity', 'pickup_start', 'pickup_deadline'];
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };

function timestamp(value) {
  if (typeof value !== 'string' || !/T.*(Z|[+-]\d{2}:\d{2})$/i.test(value) || !Number.isFinite(Date.parse(value))) {
    fail(400, 'Dates must be ISO timestamps with a timezone.');
  }
  return new Date(value);
}

function validateBody(body, editing = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || !Object.keys(body).length ||
      Object.keys(body).some(key => !fields.includes(key) && !(editing && key === 'status'))) {
    fail(400, 'Provide supported offer fields only.');
  }
}

function offerData(body) {
  const data = { ...body, description: body.description ?? '' };
  for (const field of ['title', 'category', 'area', 'location', 'description']) {
    if (typeof data[field] !== 'string' || data[field].length > (field === 'description' ? 2000 : 200) ||
        (field !== 'description' && !data[field].trim())) fail(400, `Invalid ${field}.`);
    data[field] = data[field].trim();
  }
  data.area = data.area.toLowerCase();
  data.category = data.category.toLowerCase();
  if (!Number.isInteger(data.quantity) || data.quantity < 1 || data.quantity > 2147483647) {
    fail(400, 'Quantity must be a positive integer.');
  }
  data.pickup_start = timestamp(data.pickup_start);
  data.pickup_deadline = timestamp(data.pickup_deadline);
  if (data.pickup_start >= data.pickup_deadline || data.pickup_deadline <= new Date()) {
    fail(400, 'Pickup deadline must be in the future and after pickup start.');
  }
  return data;
}

function validateId(req, res, next, id) {
  if (!/^\d+$/.test(id) || Number(id) < 1 || Number(id) > 2147483647) {
    return res.status(400).json({ error: 'Invalid offer ID.' });
  }
  next();
}

async function listOffers(req, res) {
  const { area, category, pickup_from, pickup_to, page = '1', limit = '20' } = req.query;

  if (![page, limit].every(value => typeof value === 'string' && /^\d+$/.test(value)) ||
      Number(page) < 1 || Number(page) > 1000000 || Number(limit) < 1 || Number(limit) > 100) {
    fail(400, 'Use page 1–1000000 and limit 1–100.');
  }

  const mine = req.path === '/mine';

  const conditions = mine ? ['donor_id = $1'] : ["status = 'active'", 'remaining_quantity > 0', 'pickup_deadline > now()'];
  const values = mine ? [req.user.id] : [];

  for (const [field, value] of [['area', area], ['category', category]]) {
    if (value === undefined) continue;
    if (typeof value !== 'string' || !value.trim() || value.length > 200) fail(400, `Invalid ${field} filter.`);
    values.push(value.trim().toLowerCase());
    conditions.push(`${field} = $${values.length}`);
  }

  const from = pickup_from === undefined ? null : timestamp(pickup_from);
  const to = pickup_to === undefined ? null : timestamp(pickup_to);

  if (from && to && from > to) fail(400, 'Pickup filter start must precede its end.');
  if (from) { values.push(from); conditions.push(`pickup_deadline >= $${values.length}`); }
  if (to) { values.push(to); conditions.push(`pickup_start <= $${values.length}`); }

  values.push(Number(limit), (Number(page) - 1) * Number(limit));
  const result = await pool.query(`SELECT * FROM offers WHERE ${conditions.join(' AND ')}
    ORDER BY created_at DESC, id DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
  res.json({ offers: result.rows, page: Number(page), limit: Number(limit) });
}

async function getOffer(req, res) {
  const result = await pool.query(`SELECT * FROM offers WHERE id = $1 AND (
    (status = 'active' AND remaining_quantity > 0 AND pickup_deadline > now())
    OR donor_id = $2 OR $3 = 'administrator'
    OR EXISTS (SELECT 1 FROM reservations WHERE offer_id = offers.id AND recipient_id = $2)
  )`, [req.params.id, req.user.id, req.user.role]);

  if (!result.rowCount) fail(404, 'Offer not found or unavailable.');
  res.json({ offer: result.rows[0] });
}

async function createOffer(req, res) {
  validateBody(req.body);
  const data = offerData(req.body);
  
  const result = await pool.query(`INSERT INTO offers
    (donor_id, title, description, category, area, location, quantity, pickup_start, pickup_deadline, remaining_quantity)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$7) RETURNING *`, [req.user.id, ...fields.map(field => data[field])]);
  res.status(201).json({ offer: result.rows[0] });
}

// Lock the offer first; reservation operations must use the same lock order.
async function changeOwnedOffer(req, res, change) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query('SELECT * FROM offers WHERE id = $1 FOR UPDATE', [req.params.id]);
    const offer = result.rows[0];
    if (!offer) fail(404, 'Offer not found.');
    if (offer.donor_id !== req.user.id) fail(403, 'You can only change your own offers.');
    const updated = await change(client, offer);
    await client.query('COMMIT');
    res.json({ offer: updated });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function updateOffer(req, res) {
  validateBody(req.body, true);
  return changeOwnedOffer(req, res, async (client, offer) => {
    if (offer.status === 'removed' || offer.pickup_deadline <= new Date()) fail(409, 'Removed or expired offers cannot be edited.');
    if (req.body.status !== undefined && req.body.status !== 'closed') fail(400, 'Only closing an offer is allowed through PATCH.');
    const data = offerData({ ...offer, pickup_start: offer.pickup_start.toISOString(),
      pickup_deadline: offer.pickup_deadline.toISOString(), ...req.body });
    const committed = offer.quantity - offer.remaining_quantity;
    if (data.quantity < committed) fail(409, 'Quantity cannot be lower than committed portions.');
    if (committed > 0 && (data.location !== offer.location || data.area !== offer.area ||
        +data.pickup_start !== +offer.pickup_start || +data.pickup_deadline !== +offer.pickup_deadline)) {
      fail(409, 'Collection location and times cannot change after portions are committed.');
    }
    const result = await client.query(`UPDATE offers SET title=$1, description=$2, category=$3,
      area=$4, location=$5, quantity=$6, pickup_start=$7, pickup_deadline=$8,
      remaining_quantity=$9, status=$10 WHERE id=$11 RETURNING *`,
    [...fields.map(field => data[field]), data.quantity - committed, req.body.status || offer.status, offer.id]);
    return result.rows[0];
  });
}

async function removeOffer(req, res) {
  return changeOwnedOffer(req, res, async (client, offer) => {
    if (offer.status === 'removed') return offer;
    const cancelled = await client.query(`UPDATE reservations SET status = CASE WHEN $2 THEN 'expired' ELSE 'cancelled' END
      WHERE offer_id = $1 AND status = 'reserved' RETURNING quantity, status`, [offer.id, offer.pickup_deadline <= new Date()]);
    const restored = cancelled.rows.reduce((sum, row) => sum + (row.status === 'cancelled' ? row.quantity : 0), 0);
    const result = await client.query(`UPDATE offers SET status = 'removed',
      remaining_quantity = remaining_quantity + $1 WHERE id = $2 RETURNING *`, [restored, offer.id]);
    return result.rows[0];
  });
}

module.exports = { validateId, listOffers, getOffer, createOffer, updateOffer, removeOffer };
