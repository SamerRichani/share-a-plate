const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { secret } = require('../config/auth');

function createToken(user) {
  return jwt.sign({}, secret, {
    algorithm: 'HS256', subject: String(user.id), expiresIn: '1h',
  });
}

async function register(req, res) {
  const { name, email, password, role } = req.body || {};

  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100 ||
      typeof email !== 'string' || email.trim().length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== 'string' || password.length < 12 ||
      Buffer.byteLength(password, 'utf8') > 72 || !['donor', 'recipient'].includes(role)) {
    return res.status(400).json({ error: 'Provide a name, valid email, donor/recipient role, and password of at least 12 characters (maximum 72 UTF-8 bytes).' });
  }

  const hash = await bcrypt.hash(password, 12);

  const result = await pool.query(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING
    RETURNING id, name, email, role
  `, [name.trim(), email.trim().toLowerCase(), hash, role]);

  if (!result.rowCount) return res.status(409).json({ error: 'Email already registered.' });

  const user = result.rows[0];
  res.status(201).json({ token: createToken(user), user });
}

async function login(req, res) {
  const { email, password } = req.body || {};

  if (typeof email !== 'string' || email.length > 254 ||
      typeof password !== 'string' || !password || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ error: 'Provide an email and password.' });
  }

  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
  const user = result.rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const authenticatedUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.json({ token: createToken(authenticatedUser), user: authenticatedUser });
}

function getMe(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, getMe };
