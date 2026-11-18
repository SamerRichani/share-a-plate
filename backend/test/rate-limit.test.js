// Brute-force protection: after 20 sign-in attempts in 15 minutes, the API answers 429.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('./helpers');

test('too many sign-in attempts are blocked', async () => {
  const server = await startServer();
  const attempt = () => fetch(`${server.baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email', password: 'guess' }), // invalid on purpose: no database needed
  });

  for (let i = 0; i < 20; i++) {
    assert.equal((await attempt()).status, 400);
  }
  const blocked = await attempt();
  assert.equal(blocked.status, 429);
  assert.ok(blocked.headers.get('retry-after'));
  await server.close();
});
