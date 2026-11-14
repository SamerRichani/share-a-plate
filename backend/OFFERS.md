# Offers API

All endpoints require `Authorization: Bearer <token>`.

| Method and path | Purpose |
| --- | --- |
| `GET /api/offers` | Browse active offers with remaining portions and a future deadline |
| `GET /api/offers/mine` | Donor's own offers, including closed, removed, expired, and sold-out offers |
| `GET /api/offers/:id` | Available offer details; owners, administrators, and recipients with a reservation may also view unavailable offers |
| `POST /api/offers` | Donor creates an offer |
| `PATCH /api/offers/:id` | Donor edits their own offer or sets `status` to `closed` |
| `DELETE /api/offers/:id` | Donor removes their offer while preserving its records |

Create requests require `title`, `category`, `area`, `location`, integer `quantity`, `pickup_start`, and `pickup_deadline`. `description` is optional. Dates use ISO timestamps with a timezone, such as `2027-01-15T14:00:00Z`; the deadline must be in the future and after the start. Area and category are normalized to lowercase. The server sets donor identity, status, and remaining quantity.

PATCH accepts any subset of those fields plus `status: "closed"`. Clients cannot set `donor_id` or `remaining_quantity`. Removed and expired offers cannot be edited, and closed offers cannot be reopened. Once portions are committed, pickup times and location are fixed; total quantity cannot fall below committed portions.

Both list endpoints accept `area`, `category`, `pickup_from`, `pickup_to`, `page` (default 1), and `limit` (default 20, maximum 100). Area/category filters are exact matches after normalization. The pickup filters find overlapping collection windows. Results have the shape `{ offers, page, limit }`, newest first; an empty page returns an empty array. Single-offer responses are `{ offer }`; creation returns HTTP 201.

Closing stops new reservations but preserves existing ones. Removal cancels pending reservations and restores their portions in the same transaction. Repeated removal does not restore portions twice. Collected reservations and reports remain in the database.

Edits/removal lock the offer row. Future reservation operations must lock that same offer before checking availability and changing stock. Reservation endpoints, including their deadline checks, belong to Step 6.
