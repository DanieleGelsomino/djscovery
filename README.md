# djscovery

## API

This project exposes an Express-based serverless API under `/api`.
The `vercel.json` configuration rewrites any `/api/*` request to the
single serverless function in `api/index.js`, allowing Express to handle
all subroutes.

- `GET /api/events` – list events stored in Firestore.
- `GET /api/bookings` – list bookings stored in Firestore. Supports `eventId` query parameter to filter by event.

When Firestore credentials are missing the API responds with `missing_service_account` instead of returning an HTML error page.
