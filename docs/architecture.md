# Vendor Spend Management — Architecture

## Overview

The vendors app tracks monthly spend across software vendors (AWS, Cursor, GCS, etc.). It follows the same SPA + backend service pattern as the stocks app.

## Repo Layout

```
vendors/
├── src/                      # React + Vite SPA (TypeScript)
│   ├── auth/                 # Firebase Auth gate (platform-delegated sign-in)
│   │   ├── accessPolicy.ts
│   │   ├── AuthGate.tsx
│   │   ├── AuthUserContext.ts
│   │   └── runtimeConfig.ts
│   ├── App.tsx               # Root component (GlobalNav + Sidebar layout)
│   ├── App.css               # Shell layout and sidebar positioning
│   ├── Controls.tsx          # Vendor + date filters (embedded in Sidebar)
│   ├── SpendDataView.tsx     # Tabbed container (Chart | Table toggle)
│   ├── SpendChart.tsx        # Recharts stacked BarChart
│   ├── SpendTable.tsx        # Pivot table (vendors × months)
│   ├── spend-columns.tsx     # Dynamic column definitions
│   ├── index.css             # Theme tokens + sidebar tokens
│   ├── main.tsx
│   ├── types.ts
│   └── vite-env.d.ts
├── service/                  # Cloud Run FastAPI service
│   ├── app.py                # /vendors/api/spend endpoint (boto3 Cost Explorer)
│   ├── Dockerfile
│   └── requirements.txt
├── docs/architecture.md
├── .env.example
├── vite.config.ts
├── firebase.json             # Local hosting emulator config
└── package.json
```

## Data Flow

1. User selects vendors and date range in sidebar, clicks Fetch
2. Frontend calls `GET /vendors/api/spend?vendors=aws&from=YYYY-MM-DD&to=YYYY-MM-DD`
3. FastAPI backend calls AWS Cost Explorer (`ce.get_cost_and_usage`)
4. Backend returns `{ data: [{ vendor, month, amount }] }`
5. Frontend renders stacked bar chart and pivot table

## API Contract

### `GET /vendors/api/spend`

| Param | Type | Description |
|-------|------|-------------|
| `vendors` | string | Comma-separated vendor IDs (e.g. `aws`) |
| `from` | string | Start date (YYYY-MM-DD) |
| `to` | string | End date (YYYY-MM-DD) |

Response:
```json
{
  "vendors": ["aws"],
  "from": "2025-10-01",
  "to": "2026-03-01",
  "data": [
    { "vendor": "AWS", "month": "2025-10", "amount": 86.99 },
    { "vendor": "AWS", "month": "2025-11", "amount": 97.40 }
  ]
}
```

## Routing

| Path | Target |
|------|--------|
| `/vendors/*` | Firebase Hosting → SPA `index.html` |
| `/vendors/api/**` | Firebase Hosting rewrite → Cloud Run `vendors-api` |

## Supported Vendors

| ID | Provider | Data Source |
|----|----------|------------|
| `aws` | Amazon Web Services | Cost Explorer API (boto3) |

## Local Development

1. Copy `.env.example` to `.env` and fill in AWS credentials
2. Start backend: `cd service && pip install -r requirements.txt && uvicorn app:app --port 5002`
3. Start frontend: `npm run dev` (Vite proxies `/vendors/api` to `localhost:5002`)

## Deployment

Same artifact-based pattern as stocks:
- SPA: `npm run build` → `dist/vendors/` → platform promotion
- API: Docker → Artifact Registry → Cloud Run as `vendors-api`
