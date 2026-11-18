const { Pool } = require('pg');

// A "pool" keeps a few database connections open and reuses them.
//
// Locally, pg reads PGHOST, PGPORT, PGDATABASE, PGUSER and PGPASSWORD from .env.
// When deployed, the host usually gives one DATABASE_URL instead, and the
// connection is encrypted with SSL.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: true } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (error) => {
  console.error('Unexpected idle PostgreSQL connection error:', error.message);
});

// Runs several queries as ONE unit: either all of them are saved, or none.
// Example: reserving food inserts a reservation AND lowers the portions left.
// If anything fails half way, ROLLBACK undoes everything.
async function withTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = pool;
module.exports.withTransaction = withTransaction;
