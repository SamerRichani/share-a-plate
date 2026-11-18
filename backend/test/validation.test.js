// Unit tests for the input-checking helpers.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readPagination, parseTimestamp, allowOnlyFields, isEmail } = require('../src/utils/validation');

test('pagination defaults and limits', () => {
  assert.deepEqual(readPagination({}), { page: 1, limit: 20, offset: 0 });
  assert.deepEqual(readPagination({ page: '3', limit: '10' }), { page: 3, limit: 10, offset: 20 });
  assert.throws(() => readPagination({ limit: '1000' }), { status: 400 });
  assert.throws(() => readPagination({ page: '-1' }), { status: 400 });
});

test('dates must include a timezone', () => {
  assert.ok(parseTimestamp('2026-11-19T18:00:00.000Z') instanceof Date);
  assert.throws(() => parseTimestamp('2026-11-19 18:00'), { status: 400 });
  assert.throws(() => parseTimestamp('not a date'), { status: 400 });
});

test('unexpected fields are rejected (no mass assignment)', () => {
  assert.doesNotThrow(() => allowOnlyFields({ quantity: 1 }, ['quantity'], 'bad'));
  assert.throws(() => allowOnlyFields({ quantity: 1, role: 'administrator' }, ['quantity'], 'bad'), { status: 400 });
  assert.throws(() => allowOnlyFields([1, 2], ['quantity'], 'bad'), { status: 400 });
});

test('email shape check', () => {
  assert.equal(isEmail('donor@example.test'), true);
  assert.equal(isEmail('nope'), false);
  assert.equal(isEmail("x' OR 1=1 --"), false);
});
