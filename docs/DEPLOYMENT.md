# Deploying ShareAPlate

The Express server serves both the API (`/api/...`) and the built React website, so you deploy **one web service** and **one PostgreSQL database**.

Example below: **Render** (web service) + **Neon** (PostgreSQL). Both have free plans. Any Node host + Postgres works the same way.

## 1. Create the database (Neon)

1. Create a project at neon.tech.
2. Copy the **connection string** (starts with `postgresql://…`). This is your `DATABASE_URL`.

## 2. Create the web service (Render)

1. New → **Web Service** → connect this GitHub repository.
2. Settings:

| Setting | Value |
| --- | --- |
| Root directory | *(leave empty: the repository root)* |
| Build command | `npm run build` |
| Start command | `npm run start:prod` |

3. **Environment variables** (Render → Environment):

| Name | Value |
| --- | --- |
| `DATABASE_URL` | the Neon connection string |
| `JWT_SECRET` | a new random value: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `TRUST_PROXY` | `1` (so rate limiting sees visitors' real IPs) |
| `NODE_VERSION` | `22` |

`npm run start:prod` creates the tables automatically (migrations) and starts the server. Render gives the URL, e.g. `https://shareaplate.onrender.com`. The website and API are both there (`/api/...`).

## 3. Create accounts and demo offers (once)

From your computer, point the seed script at the live database with **new, private passwords** (never the local demo ones):

```bash
cd backend
DATABASE_URL="<neon connection string>" \
ADMIN_EMAIL="admin@yourdomain.test" ADMIN_PASSWORD="<long private password>" \
DEMO_DONOR_EMAIL="donor@yourdomain.test" DEMO_DONOR_PASSWORD="<long password>" \
DEMO_RECIPIENT_EMAIL="recipient@yourdomain.test" DEMO_RECIPIENT_PASSWORD="<long password>" \
npm run db:seed
```

## Notes

- The demo-login buttons are **not** included in the deployed website (they only exist in development).
- Never put the real `DATABASE_URL` or `JWT_SECRET` in a file that is committed to Git.
- Free hosting plans may "sleep" when unused; open the site a minute before presenting.
