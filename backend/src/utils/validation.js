// Small helpers that check user input before it reaches the database.
// Every request body and query string is treated as untrusted.

const httpError = require('./httpError');

// The biggest number a PostgreSQL INTEGER column can hold.
const MAX_INT = 2147483647;

function isPositiveInteger(value) {
  return Number.isInteger(value) && value >= 1 && value <= MAX_INT;
}

function isNonEmptyString(value, maxLength) {
  return typeof value === 'string' && value.trim() !== '' && value.length <= maxLength;
}

// Simple email shape check: something@something.something
function isEmail(value) {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

// Rejects a body that contains fields we don't expect (protects against
// "mass assignment", e.g. someone sending { "role": "administrator" }).
function allowOnlyFields(body, allowedFields, message) {
  const isObject = body && typeof body === 'object' && !Array.isArray(body);
  if (!isObject || Object.keys(body).some((key) => !allowedFields.includes(key))) {
    httpError(400, message);
  }
}

// Used with router.param('id', ...) so every :id in a URL must be a positive whole number.
function validateIdParam(req, res, next, id) {
  if (!/^\d+$/.test(id) || !isPositiveInteger(Number(id))) {
    return res.status(400).json({ error: 'Invalid ID.' });
  }
  next();
}

// Reads ?page=1&limit=20 from the URL. Limit is capped at 100 so nobody
// can ask the server for a million rows at once.
function readPagination(query) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);
  if (!Number.isInteger(page) || page < 1 || page > 1000000 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    httpError(400, 'Use page 1–1000000 and limit 1–100.');
  }
  return { page, limit, offset: (page - 1) * limit };
}

// Accepts dates like "2026-11-19T18:00:00.000Z" (must include a timezone).
function parseTimestamp(value) {
  const hasTimezone = typeof value === 'string' && /T.*(Z|[+-]\d{2}:\d{2})$/i.test(value);
  if (!hasTimezone || !Number.isFinite(Date.parse(value))) {
    httpError(400, 'Dates must be ISO timestamps with a timezone.');
  }
  return new Date(value);
}

module.exports = {
  isPositiveInteger,
  isNonEmptyString,
  isEmail,
  allowOnlyFields,
  validateIdParam,
  readPagination,
  parseTimestamp,
};
