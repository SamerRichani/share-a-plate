const fs = require('node:fs/promises');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const pool = require('../src/config/db');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);

    const directory = path.join(__dirname, 'migrations');
    const files = (await fs.readdir(directory)).filter(file => file.endsWith('.sql')).sort();
    for (const file of files) {
      const applied = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [file]);
      if (applied.rowCount) continue;

      await client.query(await fs.readFile(path.join(directory, file), 'utf8'));
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      console.log(`Applied ${file}`);
    }
    await client.query('COMMIT');
    console.log('Database schema is up to date.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

migrate()
  .catch(error => {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
