// Administrator pages: see all reports and all offers, and resolve reports.
// (Removing/closing an offer is moderateOffer in offers.js.)

const pool = require('../config/db');
const httpError = require('../utils/httpError');
const { allowOnlyFields, readPagination } = require('../utils/validation');

const REPORT_STATUSES = ['open', 'resolved', 'dismissed'];
const OFFER_STATUSES = ['active', 'closed', 'removed'];

// GET /api/admin/reports?status=open
async function listReports(req, res) {
  const { status } = req.query;
  if (status !== undefined && !REPORT_STATUSES.includes(status)) httpError(400, 'Use a valid status.');
  const { page, limit, offset } = readPagination(req.query);

  const result = await pool.query(
    `SELECT * FROM reports
     WHERE ($1::text IS NULL OR status = $1)
     ORDER BY created_at DESC, id DESC
     LIMIT $2 OFFSET $3`,
    [status ?? null, limit, offset],
  );
  res.json({ reports: result.rows, page, limit });
}

// GET /api/admin/offers?status=active
async function listOffers(req, res) {
  const { status } = req.query;
  if (status !== undefined && !OFFER_STATUSES.includes(status)) httpError(400, 'Use a valid status.');
  const { page, limit, offset } = readPagination(req.query);

  const result = await pool.query(
    `SELECT * FROM offers
     WHERE ($1::text IS NULL OR status = $1)
     ORDER BY created_at DESC, id DESC
     LIMIT $2 OFFSET $3`,
    [status ?? null, limit, offset],
  );
  res.json({ offers: result.rows, page, limit });
}

// PATCH /api/admin/reports/:id with { status: 'resolved' } or { status: 'dismissed' }
async function updateReport(req, res) {
  allowOnlyFields(req.body, ['status'], 'Provide status resolved or dismissed only.');
  const { status } = req.body;
  if (!['resolved', 'dismissed'].includes(status)) httpError(400, 'Provide status resolved or dismissed only.');

  // Only an open report can be closed (a finished report stays finished).
  const result = await pool.query(
    `UPDATE reports SET status = $1
     WHERE id = $2 AND (status = 'open' OR status = $1)
     RETURNING *`,
    [status, req.params.id],
  );

  if (result.rowCount === 0) {
    const exists = await pool.query('SELECT 1 FROM reports WHERE id = $1', [req.params.id]);
    if (exists.rowCount === 0) httpError(404, 'Report not found.');
    httpError(409, 'A finalized report cannot change status.');
  }
  res.json({ report: result.rows[0] });
}

module.exports = { listReports, listOffers, updateReport };
