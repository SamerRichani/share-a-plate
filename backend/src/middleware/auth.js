const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { secret } = require('../config/auth');

async function authenticate(req, res, next) {
  const token = req.get('Authorization')?.match(/^Bearer (\S+)$/i)?.[1];
  let payload;
  try {
    payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
    if (!/^\d+$/.test(payload.sub) || !Number.isSafeInteger(Number(payload.sub)) ||
        Number(payload.sub) < 1 || Number(payload.sub) > 2147483647 || !payload.exp) {
      throw new Error('Invalid token');
    }
  } catch {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }

  const result = await pool.query(
    'SELECT id, name, email, role FROM users WHERE id = $1', [payload.sub]
  );
  if (!result.rowCount) return res.status(401).json({ error: 'Account not found.' });
  req.user = result.rows[0];
  next();
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Access denied.' });
    next();
  };
}

module.exports = { authenticate, authorize };
