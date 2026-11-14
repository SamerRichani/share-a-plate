const { Pool } = require('pg');

// pg reads PGHOST, PGPORT, PGDATABASE, PGUSER, and PGPASSWORD from the environment.
const pool = new Pool({
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (error) => {
  console.error('Unexpected idle PostgreSQL connection error:', error.message);
});

module.exports = pool;
