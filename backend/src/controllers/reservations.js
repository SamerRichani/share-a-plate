// Reservations: reserve portions, list them, cancel, and confirm pickup.

const { randomInt } = require('node:crypto');
const pool = require('../config/db');
const { withTransaction } = require('../config/db');
const httpError = require('../utils/httpError');
const { allowOnlyFields, isPositiveInteger, readPagination } = require('../utils/validation');

// A short pickup code like "K7P2XM" that is easy to read out loud and type.
// Look-alike characters (0/O, 1/I/L) are left out to avoid mistakes.
// randomInt comes from Node's crypto module, so codes can't be predicted.
const CODE_LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function makePickupCode() {
  let code = '';
  for (let i = 0; i < 6; i++) code += CODE_LETTERS[randomInt(CODE_LETTERS.length)];
  return code;
}

// POST /api/offers/:id/reservations  (recipients only) with { quantity: 2 }
async function createReservation(req, res) {
  allowOnlyFields(req.body, ['quantity'], 'Provide a positive integer quantity only.');
  const { quantity } = req.body;
  if (!isPositiveInteger(quantity)) httpError(400, 'Provide a positive integer quantity only.');

  const reservation = await withTransaction(async (client) => {
    // FOR UPDATE locks this offer until we finish. If two people reserve the
    // last portion at the same moment, the second one waits, then sees 0 left.
    const result = await client.query('SELECT * FROM offers WHERE id = $1 FOR UPDATE', [req.params.id]);
    const offer = result.rows[0];

    if (!offer) httpError(404, 'Offer not found.');
    if (offer.status !== 'active' || offer.pickup_deadline <= new Date()) httpError(409, 'Offer is no longer available.');
    if (offer.remaining_quantity < quantity) httpError(409, 'Not enough portions remain.');

    const existing = await client.query(
      "SELECT 1 FROM reservations WHERE offer_id = $1 AND recipient_id = $2 AND status = 'reserved'",
      [offer.id, req.user.id],
    );
    if (existing.rowCount > 0) httpError(409, 'You already have a pending reservation for this offer.');

    const created = await client.query(
      `INSERT INTO reservations (offer_id, recipient_id, quantity, pickup_code)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [offer.id, req.user.id, quantity, makePickupCode()],
    );
    await client.query('UPDATE offers SET remaining_quantity = remaining_quantity - $1 WHERE id = $2', [quantity, offer.id]);
    return created.rows[0];
  });

  res.status(201).json({ message: 'Reservation confirmed.', reservation });
}

// GET /api/reservations/mine           → a recipient's own reservations
// GET /api/offers/:id/reservations     → reservations on one of the donor's offers
async function listReservations(req, res) {
  const { page, limit, offset } = readPagination(req.query);
  const forOneOffer = req.params.id !== undefined;

  if (forOneOffer) {
    const result = await pool.query('SELECT donor_id FROM offers WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) httpError(404, 'Offer not found.');
    if (result.rows[0].donor_id !== req.user.id) httpError(403, 'You can only view reservations for your own offers.');
  }

  // A reservation still "reserved" after the deadline is shown as "expired".
  const result = await pool.query(
    `SELECT r.*,
       CASE WHEN r.status = 'reserved' AND o.pickup_deadline <= now() THEN 'expired' ELSE r.status END AS status,
       o.title, o.location, o.pickup_start, o.pickup_deadline
     FROM reservations r
     JOIN offers o ON o.id = r.offer_id
     WHERE ${forOneOffer ? 'r.offer_id' : 'r.recipient_id'} = $1
     ORDER BY r.created_at DESC, r.id DESC
     LIMIT $2 OFFSET $3`,
    [forOneOffer ? req.params.id : req.user.id, limit, offset],
  );
  res.json({ reservations: result.rows, page, limit });
}

// Shared by cancel and pickup: lock the offer, then the reservation (always in
// that order, like everywhere else, so two requests can never deadlock).
async function changeReservation(req, change) {
  return withTransaction(async (client) => {
    const found = await client.query('SELECT offer_id FROM reservations WHERE id = $1', [req.params.id]);
    if (found.rowCount === 0) httpError(404, 'Reservation not found.');

    const offer = await client.query('SELECT * FROM offers WHERE id = $1 FOR UPDATE', [found.rows[0].offer_id]);
    const reservation = await client.query('SELECT * FROM reservations WHERE id = $1 FOR UPDATE', [req.params.id]);
    return change(client, offer.rows[0], reservation.rows[0]);
  });
}

// POST /api/reservations/:id/cancel  (the recipient who made it)
async function cancelReservation(req, res) {
  const reservation = await changeReservation(req, async (client, offer, reservation) => {
    if (reservation.recipient_id !== req.user.id) httpError(403, 'You can only cancel your own reservations.');
    if (reservation.status === 'cancelled') return reservation;
    if (reservation.status !== 'reserved' || offer.pickup_deadline <= new Date()) {
      httpError(409, 'Only pending reservations before the deadline can be cancelled.');
    }

    const result = await client.query("UPDATE reservations SET status = 'cancelled' WHERE id = $1 RETURNING *", [reservation.id]);
    // Give the portions back to the offer.
    await client.query('UPDATE offers SET remaining_quantity = remaining_quantity + $1 WHERE id = $2', [reservation.quantity, offer.id]);
    return result.rows[0];
  });
  res.json({ reservation });
}

// POST /api/reservations/:id/pickup  (the donor who owns the offer) with { pickup_code: "K7P2XM" }
async function confirmPickup(req, res) {
  allowOnlyFields(req.body, ['pickup_code'], 'Provide the reservation pickup code only.');
  const typedCode = req.body.pickup_code;
  if (typeof typedCode !== 'string' || !/^[A-Za-z0-9]{6,32}$/.test(typedCode.trim())) {
    httpError(400, 'Provide the reservation pickup code only.');
  }

  const reservation = await changeReservation(req, async (client, offer, reservation) => {
    if (offer.donor_id !== req.user.id) httpError(403, 'Only the owning donor can confirm pickup.');
    // Upper/lower case doesn't matter when typing the code.
    if (reservation.pickup_code.toUpperCase() !== typedCode.trim().toUpperCase()) httpError(400, 'Incorrect pickup code.');
    if (reservation.status === 'collected') return reservation;

    const now = new Date();
    const insideWindow = now >= offer.pickup_start && now < offer.pickup_deadline;
    if (reservation.status !== 'reserved' || offer.status === 'removed' || !insideWindow) {
      httpError(409, 'Pickup requires a pending reservation within its collection window.');
    }

    const result = await client.query("UPDATE reservations SET status = 'collected' WHERE id = $1 RETURNING *", [reservation.id]);
    return result.rows[0];
  });
  res.json({ reservation });
}

module.exports = { createReservation, listReservations, cancelReservation, confirmPickup };
