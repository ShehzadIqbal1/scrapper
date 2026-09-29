# Maps Leads – Next.js (API + Dashboard + MongoDB)

One project: the API that receives data from the Chrome extension **and** the UI that shows it.

## Run
```bash
npm install
cp .env.example .env.local     # set MONGODB_URI
npm run dev                     # http://localhost:3000
```
Production: `npm run build && npm start`

## Connect the extension
Dashboard field **API endpoint**: `http://localhost:3000/api/places/bulk`
(tick "Auto-send to API"). If you set `API_KEY` in `.env.local`, paste the same value in the extension's "API key" field.

## API
| Method | Path | Purpose |
|---|---|---|
| POST | /api/places/bulk | Upsert up to 500 places `{ "places": [...] }` (dedupe by `key`) |
| GET | /api/places | List: `page, limit, q, category, city, search, hasEmail, hasPhone, hasWebsite, minRating, sort, order` |
| GET | /api/places/stats | Totals + top categories |
| GET | /api/places/export | CSV (same filters) |
| GET/DELETE | /api/places/:id | One place / delete |
| GET | /api/health | DB connection check |

## Deploying (Vercel + MongoDB Atlas)
Set `MONGODB_URI` (Atlas) and `API_KEY` in project env vars, then use
`https://your-app.vercel.app/api/places/bulk` in the extension.
The dashboard has no login – add auth before exposing it publicly.
