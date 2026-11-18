// Creates backend/.env from .env.example (only if it doesn't exist yet)
// and fills in a brand-new random JWT_SECRET, so no secret is ever shared in Git.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const envFile = path.join(__dirname, '..', '.env');
const exampleFile = path.join(__dirname, '..', '.env.example');

if (fs.existsSync(envFile)) {
  console.log('backend/.env already exists — leaving it unchanged.');
} else {
  const secret = crypto.randomBytes(64).toString('hex');
  const content = fs.readFileSync(exampleFile, 'utf8').replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${secret}`);
  fs.writeFileSync(envFile, content);
  console.log('Created backend/.env with a new random JWT_SECRET.');
  console.log('Now open backend/.env and set PGPASSWORD to your database password.');
}
