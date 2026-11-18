// Checks WHO is making a request (authentication) and
// WHAT they are allowed to do (authorization).

const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { secret } = require('../config/auth');
const { isPositiveInteger } = require('../utils/validation');

// Step 1 — authenticate: read the token from the "Authorization: Bearer <token>"
// header, check its signature and expiry, then load the user from the database.
async function authenticate(req, res, next) {
  const header = req.get('Authorization') || '';
  const token = header.match(/^Bearer (\S+)$/i)?.[1];

  let userId;
  try {
    // Only accept tokens signed by OUR secret with HS256 (blocks forged tokens
    // and the "alg: none" trick). Expired tokens throw an error here too.
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
    userId = Number(payload.sub);
    if (!isPositiveInteger(userId) || !payload.exp) throw new Error('Bad token contents');
  } catch {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }

  // The role is read fresh from the database on every request, so it can
  // never be faked by editing the token or the browser.
  const result = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [userId]);
  if (result.rowCount === 0) {
    return res.status(401).json({ error: 'Account not found.' });
  }

  req.user = result.rows[0];
  next();
}

// Step 2 — authorize: only let certain roles through.
// Example: router.post('/', authorize('donor'), createOffer)
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ error: 'Access denied.' });
    next();
  };
}

module.exports = { authenticate, authorize };
