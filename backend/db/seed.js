const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const bcrypt = require('bcrypt');
const pool = require('../src/config/db');

const LEGACY_DEMO_DONOR_EMAIL = 'community-kitchen@demo.invalid';
const demoOffers = [
  {
    title: 'Fresh sourdough loaves',
    description: 'Baked this morning with a crisp crust and soft center. Demo offer for preview; pickup details are examples.',
    category: 'bakery',
    area: 'old town',
    location: 'Demo pickup: Old Town Community Kitchen',
    quantity: 8,
    pickupStartHours: 1,
    pickupDeadlineHours: 8,
  },
  {
    title: 'Seasonal produce boxes',
    description: 'A mix of ripe tomatoes, leafy greens, and root vegetables from this week. Demo offer for preview; pickup details are examples.',
    category: 'produce',
    area: 'riverside',
    location: 'Demo pickup: Riverside Community Pantry',
    quantity: 6,
    pickupStartHours: 3,
    pickupDeadlineHours: 27,
  },
  {
    title: 'Vegetarian lunch bowls',
    description: 'Roasted vegetables, herbed rice, and chickpeas, packed and ready to collect. Demo offer for preview; pickup details are examples.',
    category: 'prepared meals',
    area: 'market district',
    location: 'Demo pickup: Market District Cafe',
    quantity: 5,
    pickupStartHours: 1,
    pickupDeadlineHours: 6,
  },
  {
    title: 'Mixed pastry box',
    description: 'A dozen assorted croissants and fruit pastries from today’s bake. Demo offer for preview; pickup details are examples.',
    category: 'bakery',
    area: 'north end',
    location: 'Demo pickup: North End Bakehouse',
    quantity: 4,
    pickupStartHours: 2,
    pickupDeadlineHours: 12,
  },
  {
    title: 'Apples, oranges, and pantry staples',
    description: 'A family-size bag of fresh fruit with a few shelf-stable essentials. Demo offer for preview; pickup details are examples.',
    category: 'groceries',
    area: 'garden quarter',
    location: 'Demo pickup: Garden Quarter Food Hub',
    quantity: 7,
    pickupStartHours: 5,
    pickupDeadlineHours: 48,
  },
];

async function seedUser({ email, name, password, role }) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
      typeof password !== 'string' || password.length < 12 ||
      Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error(`${role} demo user needs a valid email and a password of 12–72 characters/bytes as required by the auth API.`);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const inserted = await pool.query(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (email) DO UPDATE
    SET password_hash = EXCLUDED.password_hash
    WHERE users.role = EXCLUDED.role
    RETURNING id, role
  `, [name, normalizedEmail, passwordHash, role]);
  const user = inserted.rows[0];

  if (!user || user.role !== role) {
    const existing = (await pool.query(
      'SELECT role FROM users WHERE email = $1',
      [normalizedEmail],
    )).rows[0];
    if (existing && existing.role !== role) {
      throw new Error(`Email ${normalizedEmail} already belongs to an account with a different role.`);
    }
    throw new Error(`Could not seed the ${role} demo account.`);
  }

  return { id: user.id };
}

async function seedDemoOffers(donorId) {
  const legacyDonor = (await pool.query(
    'SELECT id, role FROM users WHERE email = $1',
    [LEGACY_DEMO_DONOR_EMAIL],
  )).rows[0];
  if (legacyDonor && legacyDonor.role !== 'donor') {
    throw new Error(`The legacy demo account ${LEGACY_DEMO_DONOR_EMAIL} must belong to a donor.`);
  }
  if (legacyDonor && legacyDonor.id !== donorId) {
    await pool.query('UPDATE offers SET donor_id = $1 WHERE donor_id = $2', [donorId, legacyDonor.id]);
  }

  let createdOffers = 0;
  for (const offer of demoOffers) {
    const result = await pool.query(`
      INSERT INTO offers
        (donor_id, title, description, category, area, location, quantity,
         remaining_quantity, pickup_start, pickup_deadline)
      SELECT $1, $2, $3, $4, $5, $6, $7, $7,
        now() + ($8::integer * interval '1 hour'),
        now() + ($9::integer * interval '1 hour')
      WHERE NOT EXISTS (
        SELECT 1 FROM offers WHERE donor_id = $1 AND title = $2
      )
    `, [donorId, offer.title, offer.description, offer.category, offer.area,
      offer.location, offer.quantity, offer.pickupStartHours, offer.pickupDeadlineHours]);
    createdOffers += result.rowCount;
  }

  console.log(`${createdOffers} demo offer${createdOffers === 1 ? '' : 's'} added.`);
}

async function seed() {
  const credentials = [
    {
      name: 'Administrator',
      role: 'administrator',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    },
    {
      name: 'ShareAPlate Community Kitchen',
      role: 'donor',
      email: process.env.DEMO_DONOR_EMAIL,
      password: process.env.DEMO_DONOR_PASSWORD,
    },
    {
      name: 'Demo Recipient',
      role: 'recipient',
      email: process.env.DEMO_RECIPIENT_EMAIL,
      password: process.env.DEMO_RECIPIENT_PASSWORD,
    },
  ];
  const normalizedEmails = credentials.map(({ email }) => email?.trim().toLowerCase());
  if (normalizedEmails.some(email => !email) ||
      new Set(normalizedEmails).size !== normalizedEmails.length) {
    throw new Error('Set distinct ADMIN_EMAIL, DEMO_DONOR_EMAIL, and DEMO_RECIPIENT_EMAIL values.');
  }

  if (normalizedEmails[1] === LEGACY_DEMO_DONOR_EMAIL) {
    throw new Error(`Choose a new DEMO_DONOR_EMAIL; ${LEGACY_DEMO_DONOR_EMAIL} is a legacy non-login account.`);
  }

  const users = {};
  for (const credentialsForUser of credentials) {
    const user = await seedUser(credentialsForUser);
    users[credentialsForUser.role] = user;
    console.log(`${credentialsForUser.name} account password synchronized from .env.`);
  }
  await seedDemoOffers(users.donor.id);
}

seed()
  .catch(error => {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
