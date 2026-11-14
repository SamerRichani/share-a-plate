const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const bcrypt = require('bcrypt');
const pool = require('../src/config/db');

async function seed() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password ||
      password.length < 2 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters, at most 72 UTF-8 bytes).');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = await pool.query(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES ('Administrator', $1, $2, 'administrator')
    ON CONFLICT (email) DO NOTHING
    RETURNING id
  `, [email, passwordHash]);

  if (!result.rowCount) {
    const existing = await pool.query('SELECT role FROM users WHERE email = $1', [email]);
    if (existing.rows[0]?.role !== 'administrator') {
      throw new Error('This email belongs to a non-administrator account. Choose another email.');
    }
  }
  console.log(result.rowCount ? 'Administrator created.' : 'Administrator already exists; unchanged.');
}

seed()
  .catch(error => {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
