# Authentication

The API uses bcrypt password hashes and HS256 JWT bearer tokens valid for one hour. Set `JWT_SECRET` to a random secret of at least 32 bytes in the ignored local environment file. Never put it in frontend code. Registration accepts only `donor` and `recipient`; create administrators with the existing seed command.

| Endpoint | Request | Success |
| --- | --- | --- |
| `POST /api/auth/register` | JSON: `name`, `email`, `password`, `role` | 201 with `{ token, user }`; account is signed in automatically |
| `POST /api/auth/login` | JSON: `email`, `password` | 200 with `{ token, user }` |
| `GET /api/auth/me` | Header: `Authorization: Bearer <token>` | 200 with `{ user }` |

Passwords must have at least 12 characters and at most 72 UTF-8 bytes. Names are trimmed; email addresses are trimmed and lowercased. Responses never include password hashes. Invalid input returns 400, authentication failures 401, role restrictions 403, and duplicate registration 409.

For the React integration, keep the token in memory and send it in the Authorization header. Sign out by clearing it. Refreshing the page or token expiry requires login again. There is no refresh-token or server-side logout system; an issued token remains valid until expiry. Use HTTPS when deploying.

The [authentication middleware](src/middleware/auth.js) verifies the token and loads the current user from PostgreSQL, so deleted accounts and changed roles take effect immediately. Protected routes use `authenticate`, followed by `authorize('donor')`, `authorize('recipient')`, or `authorize('administrator')`. More than one allowed role may be passed.

`/me` always returns the authenticated account, never an account selected by a client-supplied ID. Resource ownership checks will be added alongside offers and reservations: role checks alone do not grant access to another user's records. No offer, reservation, or administrator feature routes are added in this step. Login throttling remains part of the planned hardening step.
