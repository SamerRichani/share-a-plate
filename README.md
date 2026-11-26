# ShareAPlate 🍽️

**ShareAPlate helps good food get eaten instead of thrown away.**

Restaurants, bakeries and shops often have food left over at the end of the day. ShareAPlate lets them post that food online, so charities and people in the community can reserve it and pick it up for free.

*Capstone project by Samer Richani, Alfred Haber and Ziad Boutros.*

**🌐 Live demo:** https://famed-blue-wallaby-04.hostingersite.com — sign-in details in [Live deployment](#live-deployment).

---

## Features

| Who | What they can do |
| --- | --- |
| 🧑‍🍳 **Donor** (restaurant, bakery, shop…) | Post, edit, close and remove food offers · see who reserved · confirm pickup with the recipient's code |
| 🙋 **Recipient** (person or charity) | Browse and filter offers (area, food type, pickup time) · reserve portions · get a 6-character pickup code · cancel |
| 🛡️ **Administrator** | Review reports from users · resolve or dismiss them · close or remove any offer |
| Everyone | Sign up / sign in · report a suspicious offer |

**Beyond basic CRUD:** the reservation system. Portions are held safely even when two people reserve the last one at the same moment (database transactions with row locking), pickups are verified with a random code, and offers move through statuses (active → closed → removed) while history is kept.

## Tech stack

| Part | Technology |
| --- | --- |
| Website (frontend) | React 19, React Router, Vite, plain CSS |
| Server (backend) | Node.js, Express 5 (REST API) |
| Database | PostgreSQL (queries with the `pg` library) |
| Login | bcrypt (password hashing) + JWT (signed login tokens) |
| Tests | Node's built-in test runner (backend), Vitest + Testing Library (frontend) |

## Architecture

```text
 Browser (React website)  ──HTTP + JSON──▶  Express API  ──SQL──▶  PostgreSQL
   frontend/src                               backend/src          4 tables
```

A request travels through the backend like this:

```text
request → security headers → rate limit → route → authenticate → authorize(role) → controller → database
```

| Folder | What's inside |
| --- | --- |
| `frontend/src/pages/` | One file per page (sign in, find food, my offers, admin…) |
| `frontend/src/components/` | Reusable pieces (header, offer card, buttons, form fields) |
| `frontend/src/services/api.js` | The one place where the website talks to the server |
| `frontend/src/context/AuthContext.jsx` | Who is signed in, shared with every page |
| `backend/src/routes/` | The list of API URLs and which role may use each |
| `backend/src/controllers/` | What each URL actually does (the business rules) |
| `backend/src/middleware/` | Login checks (`auth.js`) and protections (`security.js`) |
| `backend/src/utils/` | Input checking helpers and the error helper |
| `backend/db/` | Database tables (`migrations/`) and demo data (`seed.js`) |

**Database tables:** `users` (with role), `offers`, `reservations` (with pickup code), `reports`. See [backend/db/SCHEMA.md](backend/db/SCHEMA.md).

### API at a glance

| Method & URL | Who |
| --- | --- |
| `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` | Anyone / signed in |
| `GET /api/offers`, `GET /api/offers/:id` | Signed in |
| `GET /api/offers/mine`, `POST /api/offers`, `PATCH /api/offers/:id`, `DELETE /api/offers/:id` | Donor (own offers) |
| `POST /api/offers/:id/reservations`, `GET /api/reservations/mine`, `POST /api/reservations/:id/cancel` | Recipient |
| `GET /api/offers/:id/reservations`, `POST /api/reservations/:id/pickup` | Donor (own offers) |
| `POST /api/offers/:id/reports` | Signed in |
| `GET /api/admin/reports`, `PATCH /api/admin/reports/:id`, `GET /api/admin/offers`, `PATCH /api/admin/offers/:id` | Administrator |

## Security

- **Passwords** are hashed with bcrypt (cost 12), never stored as text. Minimum 12 characters.
- **Login tokens (JWT)** are signed with a secret key, checked on every request, and expire after 1 hour. The user's role is read from the database each time, so it can't be faked.
- **Role checks on the server** for every route (`authorize('donor')` etc.), plus ownership checks (you can only change *your* offers).
- **SQL injection:** every query uses placeholders (`$1, $2`), never string building with user input.
- **Input validation:** every field's type, length and allowed values are checked; unknown fields are rejected.
- **XSS:** React escapes all text; a strict Content-Security-Policy blocks outside scripts.
- **Brute force:** sign-in is rate limited (20 tries per 15 min per IP); the whole API is limited too.
- **Secrets are not committed:** `backend/.env` is git-ignored; `npm run setup` generates a random `JWT_SECRET`.
- **Other headers:** no iframes (clickjacking), `nosniff`, no referrer, `x-powered-by` hidden.

## Running the app on your computer

You need **Node.js 20+** and **PostgreSQL**, with the `shareaplate` database created (see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)).

**First time only:**

```bash
npm run setup
```

This creates `backend/.env` with a random secret key, installs everything, creates the tables and adds demo data. If it stops at the database step, open `backend/.env`, set `PGPASSWORD` to your database password, and run it again.

**Every time:**

```bash
npm start
```

Open **http://localhost:5173**. Press `Ctrl + C` to stop.

**Before a demo**, refresh the demo offers so they're available to pick up:

```bash
npm run db:seed --prefix backend
```

## Demo accounts (local only)

On the sign-in page, the demo buttons fill these in. They only appear when running locally, never on the public site.

| Button | Email | Password |
| --- | --- | --- |
| Donor demo | `donor@example.test` | `donor123@123` |
| Recipient demo | `recipient@example.test` | `recipient123@123` |
| Admin demo | `admin@example.test` | `admin123@123` |

## Tests

```bash
npm test
```

- **Backend (13 tests)** in `backend/test/`: rejects missing/forged/unsigned tokens, blocks admin sign-up, refuses bad JSON and huge bodies, checks security headers and the sign-in rate limit, and unit-tests the input checks.
- **Frontend (6 tests)** in `frontend/src/tests/`: offer card display, user-typed HTML shown as plain text (XSS), sign-in redirect for protected pages, date formatting.

## Deployment

The backend can also serve the built website, so the whole app can deploy as **one web service + one PostgreSQL database**. Step-by-step: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

### Live deployment

| Part | Where it runs | URL |
| --- | --- | --- |
| Website (frontend, static site) | Hostinger | https://famed-blue-wallaby-04.hostingersite.com |
| Server (backend API, Node.js) | Hostinger | https://tremendous-darkseagreen-turtle-62.hostingersite.com |
| Database (PostgreSQL) | Neon | Holds the tables, 3 accounts and 5 demo offers |

**Accounts on the live site:**

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@shareaplate.test` | `IVOhHEljdRgmhurCwTTJmGvh` |
| Donor | `donor@shareaplate.test` | `tzo3r5QxN45dloCuUzhWD7cv` |
| Recipient | `recipient@shareaplate.test` | `DIj5UBuYhSXFUkZqr3rBSqLG` |

## What we'd build next

Email reminders before pickup · a map of nearby offers · a dashboard of meals saved · a waitlist when food runs out · account lockout and two-factor login for admins.
