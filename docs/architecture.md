# Vendor Spend Management — Architecture

## Overview

The vendors app tracks monthly spend across software vendors (AWS, Cursor, GCS, etc.). It follows the same SPA + backend service pattern as the stocks app. All data flows through the agent service API (`/agent/api/`) — no direct Firestore access from the frontend.

## Repo Layout

```text
vendors/
├── .cursor/
│   ├── rules/
│   │   ├── architecture-pointer.mdc
│   │   ├── branch-safety-reminder.mdc
│   │   ├── cross-repo-status.mdc
│   │   ├── local-dev-testing.mdc
│   │   ├── pr-conventions.mdc
│   │   ├── repo-hygiene.mdc
│   │   ├── service-oriented-data-access.mdc
│   │   └── todo-conventions.mdc
│   └── skills/
│       └── brand-guidelines/
│           └── SKILL.md
├── .github/
│   ├── pull_request_template.md
│   └── workflows/
│       ├── ci.yml                    # PR checks (lint + build)
│       └── publish-artifact.yml
├── docs/
│   └── architecture.md
├── scripts/
│   ├── generate-manifest.mjs
│   ├── package-artifacts.sh
│   └── seed-vendors.mjs              # Legacy Firestore seed (vendors now in Postgres)
├── service/                           # Cloud Run FastAPI service
│   ├── app.py                         # /vendors/api/spend endpoint (boto3 Cost Explorer)
│   ├── Dockerfile
│   └── requirements.txt
├── src/                               # React + Vite SPA (TypeScript)
│   ├── auth/                          # Firebase Auth gate (platform-delegated sign-in)
│   │   ├── accessPolicy.ts            # RBAC + fetchUserDoc (imports shared helpers)
│   │   ├── AuthGate.tsx
│   │   ├── AuthUserContext.ts
│   │   └── runtimeConfig.ts
│   ├── App.tsx                        # Root component (AppRail + PaneToolbar + PaneLayout)
│   ├── App.css
│   ├── SpendChart.tsx                 # Recharts stacked BarChart
│   ├── SpendDataView.tsx              # Tabbed container (Chart | Table toggle)
│   ├── SpendTable.tsx                 # Pivot table (vendors × months)
│   ├── SpendToolbar.tsx               # Dept/vendor/date filters toolbar
│   ├── VendorConfirmCsvBatch.tsx      # CSV batch update confirmation modal
│   ├── VendorConfirmEdit.tsx          # Single-vendor edit confirmation modal (diff view)
│   ├── VendorDetail.tsx               # Vendor detail dialog (view + edit modal)
│   ├── VendorList.tsx                 # Vendor metadata table
│   ├── fetchVendorSpend.ts            # Spend data fetcher (agentFetch → /agent/api/spend)
│   ├── groupSpendRows.ts             # Spend data grouping/pivot helpers
│   ├── index.css                      # Theme tokens
│   ├── main.tsx
│   ├── spend-columns.tsx              # Dynamic spend column definitions
│   ├── types.ts                       # Vendor + spend types
│   ├── useVendors.ts                  # Vendor list fetcher (agentFetch → /agent/api/vendors)
│   ├── vendor-columns.tsx             # Vendor table column definitions
│   └── vite-env.d.ts
├── .env.example
├── .gitignore
├── eslint.config.js
├── firebase.json                      # Hosting config (headers, rewrites, emulator)
├── index.html
├── package-lock.json
├── package.json
├── README.md
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Data Flow

### Vendor metadata

1. `useVendors` hook fetches the vendor list via `agentFetch('/vendors', getIdToken)`
2. The agent service reads the Postgres `vendors` table and returns the list
3. Vendor list, filters, and detail dialog are driven by the fetched data

### Spend data (on-demand)

1. User selects vendors, departments, and date range in the `SpendToolbar`
2. `fetchVendorSpend` calls `agentFetch('/spend?vendors=...&from=YYYY-MM-DD&to=YYYY-MM-DD', getIdToken)`
3. Agent service queries billing APIs (AWS Cost Explorer, GCP BigQuery, Bill.com) server-side
4. Returns `{ data: [{ vendor, month, amount }] }`
5. `groupSpendRows` pivots the data; frontend renders stacked bar chart and pivot table

### Vendor mutations

1. Edits go through `agentFetch('/vendors/:id', getIdToken, { method: 'PATCH', body })`
2. The agent service handles all Postgres writes server-side

## Database

All vendor data is stored in Cloud SQL Postgres (`haderach-main` instance, `haderach` database), managed by the agent service. The full schema is in `agent/migrations/001_init.sql`. Key tables:

- `vendors` — vendor metadata (name, category, status, billing_cycle, payment_method, department, source_system, etc.)
- `spend` — monthly spend records (vendor_id, month, amount, source_system)
- `departments` — department lookup for vendor grouping

The frontend never accesses the database directly — all reads and writes go through the agent service API.

## Chat UI

The vendors app uses the domain shell layout from `@haderach/shared-ui`:

- **AppRail** — collapsible left rail with domain navigation, feedback popover, and user avatar.
- **PaneToolbar** — horizontal toolbar toggling chat, analytics, and data panes.
- **PaneLayout** — resizable three-pane area (chat | analytics | data) using `react-resizable-panels`.
- **ChatPanel** (from `@haderach/shared-ui`) — embedded in the chat pane (`mode="panel"`). Communicates with the agent service at `/agent/api/chat`.

The app defaults to chat-only view on load. The analytics pane holds the spend toolbar, chart, and pivot table. The data pane holds the vendor metadata table.

### Agent tool-calling

The agent can add, modify, query, and export vendor records via OpenAI tool-calling against Postgres. Key interactions:

- **`modify_vendor`** — returns `confirm_edit` pending actions with a field-level diff. The `VendorConfirmEdit` modal renders before/after values for user approval; on confirm the edit is applied automatically.
- **`process_vendor_csv` / `generate_vendor_edit_csv`** — bulk CSV update flow. Returns `confirm_csv_batch` pending actions. The `VendorConfirmCsvBatch` modal shows a summary table of all proposed changes for user approval.
- **`add_vendor`** — creates a new vendor record directly.
- **`delete_vendor`** — currently disabled for LLM interaction.
- **Spend queries** — the agent can answer live spend questions (e.g. "What's my AWS spend this month?") using the `execute_python` tool, which generates Python at runtime to call billing APIs in a sandboxed executor (`agent/service/sandbox.py`).

All requests to the agent service include a Firebase ID token via `Authorization: Bearer <idToken>`. The `agentFetch` helper (from `@haderach/shared-ui`) obtains the token via `getIdToken()` and attaches it to every request.

### Authentication

Authentication is centralized at the platform level. Auth primitives (`buildDisplayName`) and RBAC helpers (`APP_CATALOG`, `APP_GRANTING_ROLES`, `hasAppAccess`, `getAccessibleApps`) are imported from `@haderach/shared-ui`. `AuthUser` extends `BaseAuthUser` (from shared-ui) with vendor-specific fields (`allowedDepartments`, `allowedVendorIds`, `deniedVendorIds`, `isFinanceAdmin`). The vendor-extended `fetchUserDoc` is kept locally since it returns additional spend-filtering fields.

In production, unauthenticated users are redirected to `/?returnTo=/vendors/` for platform sign-in. In local dev (`import.meta.env.DEV`), the app shows a dev-only "Sign in with Google" button instead of redirecting, allowing authentication directly on the app's origin without requiring haderach-home to be running.

In local development, Vite proxies `/agent/api` to `localhost:8080` (the agent service).

## API Contract

### `GET /vendors/api/health`

Returns `{"status": "ok"}`.

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

### `PATCH /agent/api/vendors/:vendor_id`

Requires `Authorization: Bearer <idToken>`.
Partial-update a vendor record. Body is a JSON object of fields to update. Returns the full vendor record after update.

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

1. Copy `.env.example` to `.env` and fill in credentials:
   - `VITE_FIREBASE_*` vars (copy from `stocks/.env.local` or `haderach-home/.env.local`)
   - `VENDOR_AWS_BILLING_CREDENTIALS` (JSON format for spend API)
   - `VITE_AUTH_BYPASS=true` for dev without the full sign-in flow
2. Start backend: `cd service && pip install -r requirements.txt && uvicorn app:app --port 5002`
3. Start frontend: `npm run dev` (Vite proxies `/vendors/api` to `localhost:5002` and `/agent/api` to `localhost:8080`)

In auth-bypass mode, the app skips sign-in and renders with mock user data. No agent service connection is needed.

### Seeding vendor data

Vendor data is seeded via `agent/scripts/seed_users.py` (Postgres). The legacy `scripts/seed-vendors.mjs` targeted Firestore and is no longer used for production data.

## Deployment

Same artifact-based pattern as stocks:
- SPA: `npm run build` → `dist/vendors/` → platform promotion
- API: Docker → Artifact Registry → Cloud Run as `vendors-api`
