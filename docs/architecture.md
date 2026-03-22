# Vendor Spend Management — Architecture

## Overview

The vendors app tracks monthly spend across software vendors (AWS, Cursor, GCS, etc.). It follows the same SPA + backend service pattern as the stocks app.

## Repo Layout

```text
vendors/
├── .cursor/
│   ├── rules/
│   │   ├── architecture-pointer.mdc
│   │   ├── branch-safety-reminder.mdc
│   │   ├── pr-conventions.mdc
│   │   ├── repo-hygiene.mdc
│   │   └── todo-conventions.mdc
│   └── skills/
│       └── brand-guidelines/
│           └── SKILL.md
├── .github/
│   ├── pull_request_template.md
│   └── workflows/
│       └── publish-artifact.yml
├── docs/
│   └── architecture.md
├── scripts/
│   ├── generate-manifest.mjs
│   └── package-artifacts.sh
├── service/                      # Cloud Run FastAPI service
│   ├── app.py                    # /vendors/api/spend endpoint (boto3 Cost Explorer)
│   ├── Dockerfile
│   └── requirements.txt
├── src/                          # React + Vite SPA (TypeScript)
│   ├── auth/                     # Firebase Auth gate (platform-delegated sign-in)
│   │   ├── accessPolicy.ts
│   │   ├── AuthGate.tsx
│   │   ├── AuthUserContext.ts
│   │   └── runtimeConfig.ts
│   ├── App.tsx                   # Root component (GlobalNav + Sidebar layout)
│   ├── App.css                   # Shell layout and sidebar positioning
│   ├── Controls.tsx              # Vendor + date filters (embedded in Sidebar)
│   ├── SpendChart.tsx            # Recharts stacked BarChart
│   ├── SpendDataView.tsx         # Tabbed container (Chart | Table toggle)
│   ├── SpendTable.tsx            # Pivot table (vendors × months)
│   ├── VendorDetail.tsx          # Vendor detail slide-over panel
│   ├── VendorFilters.tsx         # Category + vendor multi-select filters
│   ├── VendorList.tsx            # Vendor metadata table
│   ├── index.css                 # Theme tokens + sidebar tokens
│   ├── main.tsx
│   ├── spend-columns.tsx         # Dynamic spend column definitions
│   ├── types.ts
│   ├── vendor-columns.tsx        # Vendor table column definitions
│   ├── vendor-data.ts            # Static vendor metadata
│   └── vite-env.d.ts
├── .env.example
├── .gitignore
├── firebase.json                 # Local hosting emulator config
├── index.html
├── package.json
├── README.md
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
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

1. Copy `.env.example` to `.env` and fill in credentials (JSON format per vendor, e.g. `VENDOR_AWS_BILLING_CREDENTIALS`)
2. Start backend: `cd service && pip install -r requirements.txt && uvicorn app:app --port 5002`
3. Start frontend: `npm run dev` (Vite proxies `/vendors/api` to `localhost:5002`)

## Deployment

Same artifact-based pattern as stocks:
- SPA: `npm run build` → `dist/vendors/` → platform promotion
- API: Docker → Artifact Registry → Cloud Run as `vendors-api`
