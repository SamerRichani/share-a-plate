# ShareAPlate — Backend Development Plan

ShareAPlate connects restaurants, bakeries, supermarkets, and other food businesses with charities and community members to redistribute surplus food. Donors publish offers, recipients reserve portions and collect them, and administrators moderate offers and reports.

This roadmap is based on the **ShareAPlate Capstone Project Proposal** by Samer Richani, Alfred Haber, and Ziad Boutros. It covers the backend roadmap; the frontend is being built in a separate, incremental track and is documented below.

## How we will work

- Complete one numbered step at a time.
- Explain each command, dependency, file path, and important technical decision during implementation.
- Verify the step against its completion check.
- Pause for your confirmation before starting the next step.

**Current status:** Step 1 is implemented, with the health endpoint omitted by request. Step 2, items 1–2 are complete: PostgreSQL 17.12 is installed and running locally, and the `shareaplate` database and `shareaplate_app` login are created and verified. Database credentials and the Express connection are still pending. Wait for confirmation before Step 2, item 3.

## 1. Scope from the proposal

### Required features

- Donor, recipient, and administrator accounts.
- Create, edit, and remove food offers.
- Filter offers by area, category, and pickup window.
- Reserve portions and receive a reservation confirmation.
- Confirm collection using a pickup workflow.
- Administrator moderation of offers and reports.

Reservation confirmation will be returned by the API and displayed in the application. Email is optional, so core reservations must work without SMTP.

### Optional features — deferred until the core application works

- Email reservation notifications and pickup reminders using SMTP.
- Nearby offers on an OpenStreetMap map using Leaflet.
- A dashboard showing redistributed portions.
- Waitlists and post-collection feedback.

These features will not add dependencies or tables to the initial implementation unless we explicitly decide to include them later.

## 2. Architecture and technology

```text
React frontend → Express REST API → PostgreSQL
```

| Part | Responsibility |
| --- | --- |
| React | Forms, pages, offer discovery, and role-specific interfaces; developed later |
| Node.js and Express | Request handling, validation, authentication, authorization, and business rules |
| PostgreSQL | Persistent records, relationships, constraints, and transactions |

Use a single Express application, plain JavaScript, and parameterized SQL through `pg`. This keeps the architecture appropriate for a university capstone and makes the database behavior visible without introducing an ORM or multiple services.

The proposal does not specify an authentication mechanism. A proposed implementation is password hashing with bcrypt and signed, expiring JWT access tokens. We will explain and finalize token handling in Step 4. Roles and account identity must be enforced by the server on every protected request.

### Planned backend structure

```text
backend/
  package.json
  .env.example
  src/
    app.js                 # Express configuration, middleware, and routes
    server.js              # Startup, database readiness, and shutdown
    config/
      db.js                # PostgreSQL connection pool
    routes/                # Endpoint definitions
    controllers/           # Request and response handling
    services/              # Business rules and multi-query transactions
    db/
      queries/             # Parameterized SQL grouped by feature
    middleware/            # Authentication, authorization, validation, errors
  db/
    migrations/            # Ordered, versioned SQL schema changes
  tests/                   # API and database integration tests
```

Create folders when needed rather than generating empty abstractions in advance. Keep database credentials and signing secrets in a local, ignored environment file; document variable names in `backend/.env.example`.

## Frontend setup

The frontend uses React, Vite, and plain JavaScript. Steps 1–9 are implemented: shared UI and responsive layouts, bearer-token authentication and role-based routing, offer discovery and donor management, recipient reservations, pickup confirmation, reporting, and administrator moderation.

### Frontend structure

```text
frontend/
  package.json
  .env.example
  vite.config.js
  src/
    main.jsx
    app/
      App.jsx               # Public pages and role-protected routes
    context/
      AuthContext.jsx       # In-memory login state and session expiry
    services/
      api.js                # Centralized JSON and bearer-token API client
    pages/
      LandingPage.jsx
      LoginPage.jsx
      RegisterPage.jsx
      OffersPage.jsx
      OfferDetailPage.jsx
      MyOffersPage.jsx
      OfferFormPage.jsx
      MyReservationsPage.jsx
      OfferReservationsPage.jsx
      AdminPage.jsx
    components/
      SiteHeader.jsx        # Role-aware navigation
      ui/                   # Reusable buttons, fields, alerts, and states
    styles/
      global.css            # Design tokens, layout, responsive rules, and UI styles
```

### Authentication and API integration

The frontend sends the API’s one-hour JWT as a bearer token held **in memory only**. It is not written to local storage, session storage, or a cookie; reloading the page signs the user out. A `401` response clears the current session and prompts the user to sign in again. Public registration offers donor and recipient roles only; administrator accounts are created through the backend seed process.

The interface uses the backend’s role restrictions and status transitions. Offer and reservation quantities, availability, collection windows, cancellation, and moderation are validated by the API; rejected changes are shown to the user rather than treated as successful. The API remains authoritative for concurrent reservations and pickup confirmation.

Protected screens are available at `/offers`, `/my-offers`, `/my-reservations`, and `/admin`; role-specific screens redirect users who do not have the required role. The Vite proxy forwards `/api` requests to the configured backend without exposing database or JWT secrets to the browser.

### Run the frontend

From the repository root:

```bash
cd frontend
npm install
npm run dev
```

Vite serves the application at `http://localhost:5173`. Requests to `/api` are proxied to `http://localhost:5000` by default. To use another backend URL, copy `.env.example` to `.env` and set `API_PROXY_TARGET`; local `.env` files are ignored by Git.

If port 5000 is already in use, run the backend on another port and point the frontend proxy at it. For example, use `PORT=5001 npm run dev` from `backend/`, then `API_PROXY_TARGET=http://localhost:5001 npm run dev` from `frontend/`.

Useful checks from `frontend/`:

```bash
npm run build
npm run lint
npm run format:check
```

Use `npm run format` to format frontend source files. Keep `package-lock.json` in version control so dependency installs remain reproducible.

## 3. Database design baseline

The proposal specifies these four tables:

| Table | Proposed fields | Relationships |
| --- | --- | --- |
| `users` | `id`, `name`, `email`, `password`, `role` | A user can own offers, reservations, or reports according to their role |
| `offers` | `id`, `donor_id`, `title`, `description`, `quantity`, `remaining_quantity`, `location`, `pickup_deadline`, `status` | Each offer belongs to a donor |
| `reservations` | `id`, `offer_id`, `recipient_id`, `quantity`, `pickup_code`, `status` | Each reservation belongs to an offer and a recipient |
| `reports` | `id`, `reporter_id`, `offer_id`, `reason`, `status` | Each report belongs to a reporter and an offer |

### Small refinements to settle in Step 3

The schema is preliminary. The following are implementation proposals, not additional features stated in the document:

- Store the password as `password_hash`, never plaintext.
- Add `category` and a consistently represented `area` to offers so the required filters work. Keep `location` for the collection address.
- Add `pickup_start` alongside `pickup_deadline` to represent a complete collection window.
- Add creation/update timestamps where needed for ordering and tracking changes.
- Define allowed status values and transitions for offers, reservations, and reports.
- Decide who confirms collection, whether recipients can cancel reservations, and how duplicate reservations are handled. The proposal does not settle these rules.
- Define how closing an offer affects existing reservations. Preserve reservation/report history instead of cascading away those records.

### Required integrity rules

- Unique, consistently normalized email addresses.
- Valid roles: donor, recipient, administrator.
- Foreign keys for all relationships.
- Positive offer and reservation quantities.
- Remaining quantity between zero and the original offer quantity.
- A pickup start earlier than the deadline, using timezone-aware timestamps.
- Unique, difficult-to-guess pickup codes with restricted visibility.
- Constraints for allowed statuses and indexes supporting common lookups.

Role ownership and time-sensitive rules also require API checks. Foreign keys alone cannot establish that an offer owner is a donor or that an offer is still reservable.

## 4. Incremental implementation steps

### Step 1 — Initialize the Express backend

**Work**

1. Check Node.js and npm availability.
2. Initialize `backend/package.json` and add development/start scripts.
3. Install Express and environment configuration support.
4. Create `backend/src/app.js` and `backend/src/server.js`.
5. Add JSON request parsing with a 100 KB request body limit. No health endpoint is planned.
6. Add smples and ignore dependencies and local secrets in Git.

**Completion check:** the server starts locally, and JSON middleware parses valid JSON requests. No application routes exist yet, so browser requests return HTTP 404.

**Local configuration and startup**

From the repository root, copy the environment template once, then start the backend:

```bash
cd backend
cp .env.example .env
npm run dev
```

The example sets `PORT=5000`. The server also defaults to port 5000 if no local environment file exists. Change `PORT` in `backend/.env` if needed. Do not overwrite an existing local environment file when repeating setup.

The root `.gitignore` excludes dependency folders and local environment files while keeping `.env.example` available to commit. Keep `package-lock.json` in Git for reproducible dependency installation. Database settings will be added in Step 2.

**Pause:** confirm the server runs before continuing.

### Step 2 — Configure PostgreSQL and verify connectivity

**Work**

1. Check PostgreSQL installation and local service availability.
2. Create a dedicated application database and database login.
3. Install `pg` and configure a connection pool in `backend/src/config/db.js`.
4. Configure local host, port, database name, username, and password through environment variables.
5. Verify database readiness at startup with a test query, without adding a health endpoint.
6. Handle connection failures clearly and close the pool during shutdown.

### Local PostgreSQL setup completed (items 1–2)

PostgreSQL 17.12 was installed through Homebrew and started as a background service that restarts at login:

```bash
brew install postgresql@17
brew services start postgresql@17
/opt/homebrew/opt/postgresql@17/bin/pg_isready -h localhost -p 5432
```

The readiness check returned `localhost:5432 - accepting connections`.

The following SQL was executed once through the local administrator connection to create the application login and database:

```sql
CREATE ROLE shareaplate_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
CREATE DATABASE shareaplate OWNER shareaplate_app;
```

The application login owns its database but cannot act as a superuser, create databases, or create roles. No application tables exist yet.

To connect manually:

```bash
/opt/homebrew/opt/postgresql@17/bin/psql -h localhost -p 5432 -U shareaplate_app -d shareaplate
```

Inside `psql`, check the connection with `SELECT current_database(), current_user;` and exit with `\q`. This query was verified to return `shareaplate` and `shareaplate_app`.

**Authentication status:** Homebrew initialized local connections with `trust` authentication. The application login currently has no password. In item 4, set its password, configure password authentication for the application connection, and add the connection settings to the ignored local environment file. The current verification proves connectivity, not password authentication. The Express application is not connected yet.

**Completion check:** a test query succeeds; an unavailable database produces a controlled failure without exposing credentials or internal errors to API clients.

**Pause:** confirm connectivity before creating tables.

### Step 3 — Finalize and create the database schema

**Work**

1. Review the baseline and resolve the business rules listed above.
2. Document the agreed statuses, transitions, and field additions.
3. Write ordered SQL migrations in `backend/db/migrations/` and a small runner that records applied migrations.
4. Create the four core tables, foreign keys, checks, unique constraints, and necessary indexes.
5. Add a repeatable way to create local development data, including an administrator with a hashed password.

**Completion check:** migrations build a fresh database, rerunning them does not reapply completed changes, and invalid relationships or quantities are rejected.

**Pause:** approve the schema before implementing account workflows.

### Step 4 — Implement authentication and role authorization

**Work**

1. Finalize token delivery, expiry, and frontend handling before implementing authentication.
2. Add registration, login, and current-user endpoints.
3. Validate inputs, normalize email addresses, hash passwords, and prevent duplicate accounts.
4. Allow public registration only for donors and recipients. Create administrators through the controlled setup process.
5. Add authentication and role middleware, plus ownership checks for individual records.
6. Return safe user data, never password hashes, and use generic login failure messages.

**Completion check:** valid users can authenticate; invalid credentials, expired tokens, self-assigned administrator roles, and unauthorized access are rejected.

**Pause:** confirm authentication and role behavior.

### Step 5 — Implement food offers and discovery

**Work**

1. Let donors create, edit, and remove their own offers according to the agreed lifecycle.
2. Add offer listing and detail endpoints.
3. Implement area, category, and pickup-window filters with bounded pagination.
4. Validate quantities, required fields, and collection dates.
5. Prevent edits from invalidating reserved portions and enforce ownership.
6. Exclude unavailable offers from discovery and reject reservations after expiry even if stored status has not changed.

**Completion check:** donors can manage their offers, cannot change another donor's offers, and filters return the expected available offers.

**Pause:** confirm offer workflows before reservations.

### Step 6 — Implement reservations and pickup confirmation

**Work**

1. Allow recipients to reserve available portions.
2. Use a PostgreSQL transaction with row locking or a conditional atomic update to prevent overselling.
3. Validate offer availability, remaining quantity, and collection deadline inside the transaction.
4. Generate a unique pickup code and return reservation confirmation.
5. Let recipients view their reservations and donors view reservations for their offers.
6. Implement pickup confirmation using the actor and code-verification rules agreed in Step 3.
7. Ensure repeated pickup requests cannot count collection twice. If cancellation is approved, restore stock only once within a transaction.

**Completion check:** simultaneous requests cannot overbook an offer; invalid pickup attempts fail; repeated confirmation leaves a single collection recorded.

**Pause:** confirm the complete reserve-and-collect workflow.

### Step 7 — Implement reports and administrator moderation

**Work**

1. Let authenticated users submit reports about offers.
2. Let administrators list and review reports and update their status.
3. Let administrators moderate offers according to the agreed lifecycle.
4. Apply the agreed handling of existing reservations when an offer is removed or moderated.
5. Restrict moderation actions to administrators and preserve related history.

**Completion check:** users can report an offer; administrators can act on it; donors and recipients cannot access administrator operations.

**Pause:** confirm moderation behavior.

### Step 8 — Test and prepare the backend for React integration

Validation and error handling are implemented throughout earlier steps; this step verifies them across the whole API.

**Work**

1. Run integration tests against a separate test database.
2. Test registration, login, offer creation, filtering, reservation, collection, and moderation together.
3. Test authorization, missing records, malformed requests, expired collection windows, concurrent reservations, and repeated state changes.
4. Standardize JSON errors and ensure production responses do not expose stack traces or secrets.
5. Add appropriate login throttling and review request size limits and parameterized queries.
6. Document endpoint inputs, responses, authentication, environment variables, migrations, and local startup commands.
7. Configure the agreed frontend development origin and authentication behavior, then verify API requests from that origin.

**Completion check:** core API workflows and failure cases pass, setup is reproducible, and the documented API is ready for the React frontend.

**Pause:** confirm backend completion before starting frontend development.

## 5. Planned API outline

These routes are a starting contract. Exact request bodies and status transitions will be documented during their implementation step.

| Area | Planned endpoints | Access |
| --- | --- | --- |
| Accounts | `POST /api/auth/register`, `POST /api/auth/login` | Public; registration cannot create administrators |
| Current user | `GET /api/auth/me` | Authenticated users |
| Discovery | `GET /api/offers`, `GET /api/offers/:id` | Registered users initially; public browsing to be settled in Step 3 |
| Donor offers | `POST /api/offers`, `PATCH /api/offers/:id`, `DELETE /api/offers/:id` | Donors; existing records require ownership |
| Reservations | `POST /api/offers/:id/reservations`, `GET /api/reservations/mine` | Recipients |
| Offer reservations | `GET /api/offers/:id/reservations` | Owning donor |
| Collection | `POST /api/reservations/:id/pickup` | Authorized actor under the agreed pickup rules |
| Reports | `POST /api/offers/:id/reports` | Authenticated users |
| Moderation | `GET /api/admin/reports`, `PATCH /api/admin/reports/:id`, `GET /api/admin/offers`, `PATCH /api/admin/offers/:id` | Administrators |

Removing an offer through the API need not physically delete its database row. Its behavior must preserve reservation and report history as agreed in Step 3.

## 6. Backend completion criteria

- [ ] A clean local setup can start the API and connect to PostgreSQL.
- [ ] Versioned migrations create the agreed schema.
- [ ] Authentication and role/ownership checks protect all relevant endpoints.
- [ ] Donors can manage offers and recipients can find suitable food.
- [ ] Reservations remain correct under concurrent requests.
- [ ] Pickup confirmation follows the agreed workflow and cannot be applied twice.
- [ ] Administrators can moderate offers and reports.
- [ ] Required workflows and meaningful failure cases are tested.
- [ ] Setup instructions and API documentation support React integration.

Optional maps, email, analytics, waitlists, and feedback remain outside these core completion criteria.
