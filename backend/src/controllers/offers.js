// Food offers: list, view, create, edit, close and remove.

const pool = require('../config/db');
const { withTransaction } = require('../config/db');
const httpError = require('../utils/httpError');
const { allowOnlyFields, isPositiveInteger, parseTimestamp, readPagination } = require('../utils/validation');

// The only fields a donor may send when creating or editing an offer.
const OFFER_FIELDS = ['title', 'description', 'category', 'area', 'location', 'quantity', 'pickup_start', 'pickup_deadline'];

// Checks every offer field and returns a cleaned copy (trimmed, lowercase area/category, real dates).
function cleanOfferData(input) {
  const offer = { ...input, description: input.description ?? '' };

  for (const field of ['title', 'category', 'area', 'location', 'description']) {
    const value = offer[field];
    const maxLength = field === 'description' ? 2000 : 200;
    const mayBeEmpty = field === 'description';
    if (typeof value !== 'string' || value.length > maxLength || (!mayBeEmpty && !value.trim())) {
      httpError(400, `Invalid ${field}.`);
    }
    offer[field] = value.trim();
  }

  // Stored in lowercase so filters match "Bakery" and "bakery".
  offer.area = offer.area.toLowerCase();
  offer.category = offer.category.toLowerCase();

  if (!isPositiveInteger(offer.quantity)) httpError(400, 'Quantity must be a positive integer.');

  offer.pickup_start = parseTimestamp(offer.pickup_start);
  offer.pickup_deadline = parseTimestamp(offer.pickup_deadline);
  if (offer.pickup_start >= offer.pickup_deadline || offer.pickup_deadline <= new Date()) {
    httpError(400, 'Pickup deadline must be in the future and after pickup start.');
  }
  return offer;
}

// GET /api/offers        → offers anyone can reserve (with optional filters)
// GET /api/offers/mine   → the signed-in donor's own offers
async function listOffers(req, res) {
  const { page, limit, offset } = readPagination(req.query);
  const onlyMine = req.path === '/mine';

  // We build the WHERE part step by step. Values always go in `values`
  // (as $1, $2…), never glued into the SQL text, so SQL injection is impossible.
  const conditions = [];
  const values = [];

  if (onlyMine) {
    values.push(req.user.id);
    conditions.push(`donor_id = $${values.length}`);
  } else {
    conditions.push("status = 'active'", 'remaining_quantity > 0', 'pickup_deadline > now()');
  }

  // Optional filters: ?area=riverside&category=bakery
  for (const field of ['area', 'category']) {
    const value = req.query[field];
    if (value === undefined) continue;
    if (typeof value !== 'string' || !value.trim() || value.length > 200) httpError(400, `Invalid ${field} filter.`);
    values.push(value.trim().toLowerCase());
    conditions.push(`${field} = $${values.length}`); // `field` comes from our own list above, not the user
  }

  // Optional time filters: ?pickup_from=...&pickup_to=...
  const from = req.query.pickup_from === undefined ? null : parseTimestamp(req.query.pickup_from);
  const to = req.query.pickup_to === undefined ? null : parseTimestamp(req.query.pickup_to);
  if (from && to && from > to) httpError(400, 'Pickup filter start must precede its end.');
  if (from) {
    values.push(from);
    conditions.push(`pickup_deadline >= $${values.length}`);
  }
  if (to) {
    values.push(to);
    conditions.push(`pickup_start <= $${values.length}`);
  }

  values.push(limit, offset);
  const result = await pool.query(
    `SELECT * FROM offers
     WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC, id DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  );
  res.json({ offers: result.rows, page, limit });
}

// GET /api/offers/:id
// You can see an offer if it's available, OR it's yours, OR you reserved it, OR you're an admin.
async function getOffer(req, res) {
  const result = await pool.query(
    `SELECT * FROM offers
     WHERE id = $1 AND (
       (status = 'active' AND remaining_quantity > 0 AND pickup_deadline > now())
       OR donor_id = $2
       OR $3 = 'administrator'
       OR EXISTS (SELECT 1 FROM reservations WHERE offer_id = offers.id AND recipient_id = $2)
     )`,
    [req.params.id, req.user.id, req.user.role],
  );
  if (result.rowCount === 0) httpError(404, 'Offer not found or unavailable.');
  res.json({ offer: result.rows[0] });
}

// POST /api/offers  (donors only)
async function createOffer(req, res) {
  allowOnlyFields(req.body, OFFER_FIELDS, 'Provide supported offer fields only.');
  const offer = cleanOfferData(req.body);

  const result = await pool.query(
    `INSERT INTO offers
       (donor_id, title, description, category, area, location, quantity, pickup_start, pickup_deadline, remaining_quantity)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $7)
     RETURNING *`,
    [req.user.id, ...OFFER_FIELDS.map((field) => offer[field])],
  );
  res.status(201).json({ offer: result.rows[0] });
}

// Shared by edit / remove / moderate:
// 1. start a transaction, 2. lock the offer row (FOR UPDATE) so nobody else
// changes it at the same time, 3. check it belongs to you (or you're admin),
// 4. run the change, 5. reply with the updated offer.
async function changeOffer(req, res, change) {
  const updated = await withTransaction(async (client) => {
    const result = await client.query('SELECT * FROM offers WHERE id = $1 FOR UPDATE', [req.params.id]);
    const offer = result.rows[0];
    if (!offer) httpError(404, 'Offer not found.');

    // Stops "IDOR" attacks: changing the id in the URL to edit someone else's offer.
    const isOwner = offer.donor_id === req.user.id;
    const isAdmin = req.user.role === 'administrator';
    if (!isOwner && !isAdmin) httpError(403, 'You can only change your own offers.');

    return change(client, offer);
  });
  res.json({ offer: updated });
}

// PATCH /api/offers/:id  (donor edits their offer, or closes it with { status: 'closed' })
async function updateOffer(req, res) {
  allowOnlyFields(req.body, [...OFFER_FIELDS, 'status'], 'Provide supported offer fields only.');
  if (Object.keys(req.body).length === 0) httpError(400, 'Provide supported offer fields only.');
  if (req.body.status !== undefined && req.body.status !== 'closed') {
    httpError(400, 'Only closing an offer is allowed through PATCH.');
  }

  return changeOffer(req, res, async (client, current) => {
    if (current.status === 'removed' || current.pickup_deadline <= new Date()) {
      httpError(409, 'Removed or expired offers cannot be edited.');
    }

    // Start from the current offer and apply the changes that were sent.
    const { status, ...changes } = req.body;
    const offer = cleanOfferData({
      ...current,
      pickup_start: current.pickup_start.toISOString(),
      pickup_deadline: current.pickup_deadline.toISOString(),
      ...changes,
    });

    // Portions already promised to people (reserved or collected).
    const committed = current.quantity - current.remaining_quantity;
    if (offer.quantity < committed) httpError(409, 'Quantity cannot be lower than committed portions.');

    // Don't move the pickup place/time once someone has reserved.
    const pickupChanged = offer.location !== current.location || offer.area !== current.area ||
      +offer.pickup_start !== +current.pickup_start || +offer.pickup_deadline !== +current.pickup_deadline;
    if (committed > 0 && pickupChanged) {
      httpError(409, 'Collection location and times cannot change after portions are committed.');
    }

    const result = await client.query(
      `UPDATE offers
       SET title = $1, description = $2, category = $3, area = $4, location = $5,
           quantity = $6, pickup_start = $7, pickup_deadline = $8,
           remaining_quantity = $9, status = $10
       WHERE id = $11
       RETURNING *`,
      [...OFFER_FIELDS.map((field) => offer[field]), offer.quantity - committed, status || current.status, current.id],
    );
    return result.rows[0];
  });
}

// DELETE /api/offers/:id  (also used by admins)
// The offer is marked "removed" (not deleted) so its history is kept.
// Pending reservations are cancelled and their portions given back.
async function removeOffer(req, res) {
  return changeOffer(req, res, async (client, offer) => {
    if (offer.status === 'removed') return offer;

    const isPastDeadline = offer.pickup_deadline <= new Date();
    const cancelled = await client.query(
      `UPDATE reservations
       SET status = CASE WHEN $2 THEN 'expired' ELSE 'cancelled' END
       WHERE offer_id = $1 AND status = 'reserved'
       RETURNING quantity, status`,
      [offer.id, isPastDeadline],
    );

    let portionsBack = 0;
    for (const row of cancelled.rows) {
      if (row.status === 'cancelled') portionsBack += row.quantity;
    }

    const result = await client.query(
      `UPDATE offers SET status = 'removed', remaining_quantity = remaining_quantity + $1
       WHERE id = $2 RETURNING *`,
      [portionsBack, offer.id],
    );
    return result.rows[0];
  });
}

// PATCH /api/admin/offers/:id  (admins only) with { status: 'closed' } or { status: 'removed' }
async function moderateOffer(req, res) {
  allowOnlyFields(req.body, ['status'], 'Provide status closed or removed only.');
  const { status } = req.body;
  if (!['closed', 'removed'].includes(status)) httpError(400, 'Provide status closed or removed only.');

  if (status === 'removed') return removeOffer(req, res);

  return changeOffer(req, res, async (client, offer) => {
    if (offer.status === 'removed') httpError(409, 'Removed offers cannot be reopened.');
    const result = await client.query("UPDATE offers SET status = 'closed' WHERE id = $1 RETURNING *", [offer.id]);
    return result.rows[0];
  });
}

module.exports = { listOffers, getOffer, createOffer, updateOffer, removeOffer, moderateOffer };
