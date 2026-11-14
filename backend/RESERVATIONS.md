# Reservations API

All endpoints require `Authorization: Bearer <token>`.

| Endpoint | Access | Body |
| --- | --- | --- |
| `POST /api/offers/:id/reservations` | Recipient | `{ "quantity": 2 }` |
| `GET /api/reservations/mine` | Recipient's own reservations | None |
| `GET /api/offers/:id/reservations` | Owning donor | None |
| `POST /api/reservations/:id/cancel` | Owning recipient | None |
| `POST /api/reservations/:id/pickup` | Owning donor | `{ "pickup_code": "<code from reservation>" }` |

Creation returns HTTP 201 with `{ message: "Reservation confirmed.", reservation }`. Cancellation and pickup return `{ reservation }`. The server generates a unique random 32-character pickup code. It is included only in responses available to the owning recipient or owning donor.

Both lists accept `page` (default 1) and `limit` (default 20, maximum 100), returning `{ reservations, page, limit }`. Results include the offer title, location, and pickup window.

- An offer must be active, before its deadline, and have enough remaining portions. Recipients may reserve before pickup starts.
- Each recipient can have one pending reservation per offer. Duplicate attempts return 409.
- Reservation creation, cancellation, and pickup lock the offer first, then its reservation. Stock changes and reservation changes commit together.
- Cancellation is allowed before the deadline and restores portions once. Repeated cancellation returns the cancelled record without changing stock.
- Donors confirm pickup using the code during the collection window. Closed offers still honor reservations. Repeated successful pickup returns the collected record without changing stock.
- Cancelled, collected, and expired reservations cannot switch to another final state.
- Lists report uncollected reservations past their deadline as `expired`, computed from the offer deadline. No scheduled task is needed; stored status may remain `reserved`, but pickup and cancellation reject it. Removing an expired offer also persists that expired status, without restoring portions.
- Another user's reservation or another donor's list is forbidden (403). Missing records return 404; invalid fields return 400; stock, deadline, and state conflicts return 409.

No email is sent. Confirmation is returned directly by the API, as required for the core workflow.
