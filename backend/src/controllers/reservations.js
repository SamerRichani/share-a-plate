const { randomBytes } = require('node:crypto');
const pool = require('../config/db');
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };

async function transaction(action) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await action(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function validateId(req, res, next, id) {
  if (!/^\d+$/.test(id) || Number(id) < 1 || Number(id) > 2147483647) {
    return res.status(400).json({ error: 'Invalid reservation ID.' });
  }
  next();
}

async function createReservation(req, res) {
  const { quantity } = req.body || {};
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 2147483647 ||
      Object.keys(req.body).some(key => key !== 'quantity')) fail(400, 'Provide a positive integer quantity only.');

  const reservation = await transaction(async client => {
    const result = await client.query('SELECT * FROM offers WHERE id = $1 FOR UPDATE', [req.params.id]);
    const offer = result.rows[0];
    if (!offer) fail(404, 'Offer not found.');
    if (offer.status !== 'active' || offer.pickup_deadline <= new Date()) fail(409, 'Offer is no longer available.');
    if (offer.remaining_quantity < quantity) fail(409, 'Not enough portions remain.');
    const existing = await client.query(`SELECT 1 FROM reservations
      WHERE offer_id = $1 AND recipient_id = $2 AND status = 'reserved'`, [offer.id, req.user.id]);
    if (existing.rowCount) fail(409, 'You already have a pending reservation for this offer.');

    const created = await client.query(`INSERT INTO reservations (offer_id, recipient_id, quantity, pickup_code)
      VALUES ($1, $2, $3, $4) RETURNING *`, [offer.id, req.user.id, quantity, randomBytes(16).toString('hex')]);
    await client.query('UPDATE offers SET remaining_quantity = remaining_quantity - $1 WHERE id = $2', [quantity, offer.id]);
    return created.rows[0];
  });
  res.status(201).json({ message: 'Reservation confirmed.', reservation });
}

function pagination(query) {
  const { page = '1', limit = '20' } = query;
  if (![page, limit].every(value => typeof value === 'string' && /^\d+$/.test(value)) ||
      Number(page) < 1 || Number(page) > 1000000 || Number(limit) < 1 || Number(limit) > 100) {
    fail(400, 'Use page 1–1000000 and limit 1–100.');
  }
  return { page: Number(page), limit: Number(limit) };
}

async function listReservations(req, res) {
  const { page, limit } = pagination(req.query);
  const forOffer = req.params.id !== undefined;
  if (forOffer) {
    const result = await pool.query('SELECT donor_id FROM offers WHERE id = $1', [req.params.id]);
    if (!result.rowCount) fail(404, 'Offer not found.');
    if (result.rows[0].donor_id !== req.user.id) fail(403, 'You can only view reservations for your own offers.');
  }
  const result = await pool.query(`SELECT r.*,
    CASE WHEN r.status = 'reserved' AND o.pickup_deadline <= now() THEN 'expired' ELSE r.status END AS status,
    o.title, o.location, o.pickup_start, o.pickup_deadline
    FROM reservations r JOIN offers o ON o.id = r.offer_id
    WHERE ${forOffer ? 'r.offer_id' : 'r.recipient_id'} = $1
    ORDER BY r.created_at DESC, r.id DESC LIMIT $2 OFFSET $3`,
  [forOffer ? req.params.id : req.user.id, limit, (page - 1) * limit]);
  res.json({ reservations: result.rows, page, limit });
}

// Always lock the offer before its reservation, matching offer edits/removal.
async function changeReservation(req, action) {
  return transaction(async client => {
    const found = await client.query('SELECT offer_id FROM reservations WHERE id = $1', [req.params.id]);
    if (!found.rowCount) fail(404, 'Reservation not found.');
    const offers = await client.query('SELECT * FROM offers WHERE id = $1 FOR UPDATE', [found.rows[0].offer_id]);
    const reservations = await client.query('SELECT * FROM reservations WHERE id = $1 FOR UPDATE', [req.params.id]);
    return action(client, offers.rows[0], reservations.rows[0]);
  });
}

async function cancelReservation(req, res) {
  const reservation = await changeReservation(req, async (client, offer, reservation) => {
    if (reservation.recipient_id !== req.user.id) fail(403, 'You can only cancel your own reservations.');
    if (reservation.status === 'cancelled') return reservation;
    if (reservation.status !== 'reserved' || offer.pickup_deadline <= new Date()) {
      fail(409, 'Only pending reservations before the deadline can be cancelled.');
    }
    const result = await client.query("UPDATE reservations SET status = 'cancelled' WHERE id = $1 RETURNING *", [reservation.id]);
    await client.query('UPDATE offers SET remaining_quantity = remaining_quantity + $1 WHERE id = $2', [reservation.quantity, offer.id]);
    return result.rows[0];
  });
  res.json({ reservation });
}

async function confirmPickup(req, res) {
  const { pickup_code } = req.body || {};
  if (typeof pickup_code !== 'string' || !/^[a-f0-9]{32}$/.test(pickup_code) ||
      Object.keys(req.body).some(key => key !== 'pickup_code')) fail(400, 'Provide the reservation pickup code only.');

  const reservation = await changeReservation(req, async (client, offer, reservation) => {
    if (offer.donor_id !== req.user.id) fail(403, 'Only the owning donor can confirm pickup.');
    if (reservation.pickup_code !== pickup_code) fail(400, 'Incorrect pickup code.');
    if (reservation.status === 'collected') return reservation;
    const now = new Date();
    if (reservation.status !== 'reserved' || offer.status === 'removed' || now < offer.pickup_start || now >= offer.pickup_deadline) {
      fail(409, 'Pickup requires a pending reservation within its collection window.');
    }
    const result = await client.query("UPDATE reservations SET status = 'collected' WHERE id = $1 RETURNING *", [reservation.id]);
    return result.rows[0];
  });
  res.json({ reservation });
}

module.exports = { validateId, createReservation, listReservations, cancelReservation, confirmPickup };
