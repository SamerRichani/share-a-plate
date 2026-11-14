const pool = require('../config/db');

async function createReport(req, res) {
  const { reason } = req.body || {};
  if (typeof reason !== 'string' || !reason.trim() || reason.length > 2000 ||
      Object.keys(req.body).some(key => key !== 'reason')) {
    return res.status(400).json({ error: 'Provide a report reason of 1–2000 characters only.' });
  }
  const result = await pool.query(`INSERT INTO reports (reporter_id, offer_id, reason)
    SELECT $1, id, $2 FROM offers WHERE id = $3 RETURNING *`, [req.user.id, reason.trim(), req.params.id]);
  if (!result.rowCount) return res.status(404).json({ error: 'Offer not found.' });
  res.status(201).json({ report: result.rows[0] });
}

module.exports = { createReport };
