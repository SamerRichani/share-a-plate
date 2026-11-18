// Sign up, sign in, and "who am I?".

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { secret } = require('../config/auth');
const { isEmail, isNonEmptyString } = require('../utils/validation');

// bcrypt "cost" 12 = the hash is deliberately slow (~0.25 s), so an attacker
// who steals the database can only test a few passwords per second.
const BCRYPT_COST = 12;

// Used when the email doesn't exist, so a wrong email takes just as long as a
// wrong password. Otherwise attackers could time replies to find real emails.
const FAKE_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_COST);

// Passwords: at least 12 characters. bcrypt only reads the first 72 bytes.
function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 12 && Buffer.byteLength(password, 'utf8') <= 72;
}

// A signed "pass" proving who the user is. It contains only the user id and
// expires after 1 hour. It is signed with JWT_SECRET, so it can't be edited.
function createToken(user) {
  return jwt.sign({}, secret, { algorithm: 'HS256', subject: String(user.id), expiresIn: '1h' });
}

// Only these fields are ever sent back (never the password hash).
function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

// POST /api/auth/register
async function register(req, res) {
  const { name, email, password, role } = req.body || {};

  // Only donor and recipient can sign up. Administrator can never be chosen here.
  const valid = isNonEmptyString(name, 100) && isEmail(email) && isValidPassword(password) &&
    ['donor', 'recipient'].includes(role);
  if (!valid) {
    return res.status(400).json({
      error: 'Provide a name, valid email, donor/recipient role, and password of at least 12 characters (maximum 72 UTF-8 bytes).',
    });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  // $1, $2… are placeholders: the database treats the values as plain data,
  // never as SQL code. This is what prevents SQL injection.
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING
     RETURNING id, name, email, role`,
    [name.trim(), email.trim().toLowerCase(), passwordHash, role],
  );

  if (result.rowCount === 0) {
    return res.status(409).json({ error: 'Email already registered.' });
  }

  const user = result.rows[0];
  res.status(201).json({ token: createToken(user), user: publicUser(user) });
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body || {};

  if (!isEmail(email) || typeof password !== 'string' || !password || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ error: 'Provide an email and password.' });
  }

  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
  const user = result.rows[0];

  // Always run bcrypt (with a fake hash if needed) so timing reveals nothing.
  const passwordMatches = await bcrypt.compare(password, user ? user.password_hash : FAKE_HASH);

  // Same message for "no such email" and "wrong password".
  if (!user || !passwordMatches) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  res.json({ token: createToken(user), user: publicUser(user) });
}

// GET /api/auth/me
function getMe(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, getMe };
