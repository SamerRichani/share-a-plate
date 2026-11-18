// Builds the Express application: security, routes and error handling.
// (server.js is the file that actually starts it.)

const path = require('node:path');
const fs = require('node:fs');
const express = require('express');
const { securityHeaders, rateLimit } = require('./middleware/security');

const app = express();

// Don't advertise that we use Express (gives attackers less information).
app.disable('x-powered-by');

// When deployed behind a host's proxy (Render, Railway…), trust its
// X-Forwarded-For header so rate limiting sees the visitor's real IP.
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY));

app.use(securityHeaders);

// Read JSON request bodies, but refuse anything bigger than 100 KB.
app.use(express.json({ limit: '100kb' }));

// Rate limits: 1000 requests per 15 minutes for the whole API, and only
// 20 sign-in / sign-up attempts per 15 minutes (stops password guessing).
const apiLimit = rateLimit({ windowMinutes: 15, max: 1000, message: 'Too many requests. Please slow down.' });
const loginLimit = rateLimit({ windowMinutes: 15, max: 20, message: 'Too many sign-in attempts. Try again in 15 minutes.' });

app.use('/api', apiLimit);
app.use('/api/auth/login', loginLimit);
app.use('/api/auth/register', loginLimit);

// The API routes. Each file lists the URLs for one part of the app.
app.use('/api/auth', require('./routes/auth'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/admin', require('./routes/admin'));

// Unknown API URL → 404 in JSON.
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// In production the same server also sends the built React website
// (frontend/dist), so the whole app runs as one service.
const websiteFolder = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(websiteFolder)) {
  app.use(express.static(websiteFolder));
  // Any other page (e.g. /offers/5) returns index.html and React shows the right page.
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    res.sendFile(path.join(websiteFolder, 'index.html'));
  });
}

// Error handler: turns errors into clean JSON replies.
// Real error details are only logged on the server, never sent to the user.
app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body.' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large.' });
  }
  // Errors we created on purpose with httpError(status, message).
  if (error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error('Request failed:', error);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

module.exports = app;
