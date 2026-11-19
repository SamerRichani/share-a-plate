const path = require('node:path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = require('./app');
const pool = require('./config/db');
const port = Number(process.env.PORT || 5001);

async function startServer() {
  try {
    await pool.query('SELECT 1');
    console.log('PostgreSQL connected.');

    const server = app.listen(port, (error) => {
      // Express 5 calls this with an error if the port can't be used.
      if (error) return;
      console.log(`ShareAPlate API running at http://localhost:${server.address().port}`);
    });

    const shutdown = () => {
      server.close(() => {
        pool.end().catch((error) => {
          console.error('Database shutdown failed:', error.message);
          process.exitCode = 1;
        });
      });
    };

    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Is ShareAPlate already running in another terminal? Stop it (Ctrl+C) and try again.`);
      } else {
        console.error('Server failed:', error.message);
      }
      process.exitCode = 1;
      shutdown();
    });

  } catch (error) {
    console.error('Startup failed:', error.message);
    process.exitCode = 1;
    await pool.end();
  }
}

startServer();
