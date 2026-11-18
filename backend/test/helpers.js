// Starts the Express app on a free port for tests (no database needed for these checks).
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-the-check-1234567890';

const app = require('../src/app');

async function startServer() {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://localhost:${server.address().port}`;
  return { baseUrl, close: () => new Promise((resolve) => server.close(resolve)) };
}

module.exports = { startServer };
