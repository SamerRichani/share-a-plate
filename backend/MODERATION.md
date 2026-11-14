# Reports and moderation

All endpoints require a bearer token. Report submission is available to any authenticated user; `/api/admin` endpoints require an administrator.

| Endpoint | Body / purpose |
| --- | --- |
| `POST /api/offers/:id/reports` | `{ "reason": "Describe the issue" }`; creates an open report (201) |
| `GET /api/admin/reports` | Review reports, including reason, reporter ID, offer ID, and status |
| `PATCH /api/admin/reports/:id` | `{ "status": "resolved" }` or `{ "status": "dismissed" }` |
| `GET /api/admin/offers` | Review offers across all states, including unavailable offers |
| `PATCH /api/admin/offers/:id` | `{ "status": "closed" }` or `{ "status": "removed" }` |

Lists accept an optional `status` filter, `page` (default 1), and `limit` (default 20, maximum 100). They return `{ reports, page, limit }` or `{ offers, page, limit }`. Administrators can use the existing `GET /api/offers/:id` endpoint to inspect an offer's full details. No passwords or pickup codes are included in moderation lists.

Report reasons must contain 1–2000 characters. Reporter identity comes from the token, not the submitted body. Reports may reference unavailable offers so past problems can still be reported.

Reports move from `open` to `resolved` or `dismissed`. Repeating the same decision succeeds; changing a finalized decision returns 409. Report decisions do not automatically change an offer: review it, moderate it if necessary, then resolve the report.

Closing an offer prevents new reservations but honors existing ones. Removing an offer uses the same transaction and offer lock as donor removal: pending reservations before the deadline are cancelled and their portions restored once; overdue pending reservations become expired without restoring portions. Collected reservations and reports are preserved. Repeated removal is safe, and removed offers cannot be reopened.

Donor and recipient requests to administrator endpoints return 403; missing authentication returns 401. Invalid input returns 400 and missing records return 404. Moderation does not grant administrators access to the donor-only reservation endpoints.
