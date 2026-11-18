// Backend tests: run with `npm test` in backend/.
// They check that the API rejects bad or dangerous requests.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { startServer } = require('./helpers');

let server;
before(async () => { server = await startServer(); });
after(async () => { await server.close(); });

const post = (path, body, headers = {}) => fetch(server.baseUrl + path, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...headers },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

test('protected routes need a login token', async () => {
  const res = await fetch(`${server.baseUrl}/api/offers`);
  assert.equal(res.status, 401);
});

test('a token signed with the wrong secret is rejected', async () => {
  const forged = jwt.sign({}, 'attacker-secret-attacker-secret-attacker', { subject: '1', expiresIn: '1h' });
  const res = await fetch(`${server.baseUrl}/api/offers`, { headers: { Authorization: `Bearer ${forged}` } });
  assert.equal(res.status, 401);
});

test('an unsigned "alg: none" token is rejected', async () => {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: '1', exp: 9999999999 })).toString('base64url');
  const res = await fetch(`${server.baseUrl}/api/offers`, { headers: { Authorization: `Bearer ${header}.${payload}.` } });
  assert.equal(res.status, 401);
});

test('nobody can sign up as an administrator', async () => {
  const res = await post('/api/auth/register', {
    name: 'Mallory', email: 'mallory@example.test', password: 'long-enough-password', role: 'administrator',
  });
  assert.equal(res.status, 400);
});

test('short passwords are refused at sign-up', async () => {
  const res = await post('/api/auth/register', {
    name: 'Sam', email: 'sam@example.test', password: 'short', role: 'donor',
  });
  assert.equal(res.status, 400);
});

test('broken JSON gets a clean 400 error, not a crash', async () => {
  const res = await post('/api/auth/login', '{"email": ');
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { error: 'Invalid JSON body.' });
});

test('huge request bodies are refused', async () => {
  const res = await post('/api/auth/login', { email: 'a@b.c', password: 'x'.repeat(200 * 1024) });
  assert.equal(res.status, 413);
});

test('security headers are sent and Express is not advertised', async () => {
  const res = await fetch(`${server.baseUrl}/api/unknown`);
  assert.equal(res.status, 404);
  assert.match(res.headers.get('content-security-policy'), /default-src 'self'/);
  assert.equal(res.headers.get('x-frame-options'), 'DENY');
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('x-powered-by'), null);
});
