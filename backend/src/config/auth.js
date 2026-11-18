// The secret key used to sign and check login tokens (JWT).
// It lives only in backend/.env (never in Git). If it's missing or too short,
// the server refuses to start rather than running insecurely.
const secret = process.env.JWT_SECRET;

if (!secret || Buffer.byteLength(secret) < 32) {
  throw new Error('JWT_SECRET must contain at least 32 bytes. Run `npm run setup` or set it in backend/.env.');
}

module.exports = { secret };
