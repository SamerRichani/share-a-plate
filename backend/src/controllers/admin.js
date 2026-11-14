const pool = require('../config/db');

function validateId(req, res, next, id) {
  if (!/^\d+$/.test(id) || Number(id) < 1 || Number(id) > 2147483647) {
    return res.status(400).json({ error: 'Invalid ID.' });
  }
  next();
}

// Table names are fixed by the controller functions below, never by user input.
async function listRecords(req, res, table, statuses) {
  const { status, page = '1', limit = '20' } = req.query;
  if ((status !== undefined && !statuses.includes(status)) ||
      ![page, limit].every(value => typeof value === 'string' && /^\d+$/.test(value)) ||
      Number(page) < 1 || Number(page) > 1000000 || Number(limit) < 1 || Number(limit) > 100) {
    return res.status(400).json({ error: 'Use a valid status, page 1–1000000, and limit 1–100.' });
  }
  const result = await pool.query(`SELECT * FROM ${table}
    WHERE ($1::text IS NULL OR status = $1)
    ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3`,
  [status ?? null, Number(limit), (Number(page) - 1) * Number(limit)]);
  res.json({ [table]: result.rows, page: Number(page), limit: Number(limit) });
}

function listReports(req, res) {
  return listRecords(req, res, 'reports', ['open', 'resolved', 'dismissed']);
}

function listOffers(req, res) {
  return listRecords(req, res, 'offers', ['active', 'closed', 'removed']);
}

async function updateReport(req, res) {
  const { status } = req.body || {};
  if (!['resolved', 'dismissed'].includes(status) || Object.keys(req.body).some(key => key !== 'status')) {
    return res.status(400).json({ error: 'Provide status resolved or dismissed only.' });
  }
  const result = await pool.query(`UPDATE reports SET status = $1
    WHERE id = $2 AND (status = 'open' OR status = $1) RETURNING *`, [status, req.params.id]);
  if (!result.rowCount) {
    const exists = await pool.query('SELECT 1 FROM reports WHERE id = $1', [req.params.id]);
    return res.status(exists.rowCount ? 409 : 404).json({
      error: exists.rowCount ? 'A finalized report cannot change status.' : 'Report not found.',
    });
  }
  res.json({ report: result.rows[0] });
}

module.exports = { validateId, listReports, listOffers, updateReport };
