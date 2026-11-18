// Reports: any signed-in user can flag an offer for an administrator to review.

const pool = require('../config/db');
const httpError = require('../utils/httpError');
const { allowOnlyFields, isNonEmptyString } = require('../utils/validation');

// POST /api/offers/:id/reports with { reason: "..." }
async function createReport(req, res) {
  allowOnlyFields(req.body, ['reason'], 'Provide a report reason of 1–2000 characters only.');
  const { reason } = req.body;
  if (!isNonEmptyString(reason, 2000)) httpError(400, 'Provide a report reason of 1–2000 characters only.');

  // Inserts only if the offer exists (the SELECT returns no row otherwise).
  const result = await pool.query(
    `INSERT INTO reports (reporter_id, offer_id, reason)
     SELECT $1, id, $2 FROM offers WHERE id = $3
     RETURNING *`,
    [req.user.id, reason.trim(), req.params.id],
  );
  if (result.rowCount === 0) httpError(404, 'Offer not found.');
  res.status(201).json({ report: result.rows[0] });
}

module.exports = { createReport };
