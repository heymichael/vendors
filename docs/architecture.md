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
│   ├── package-artifacts.sh
│   └── seed-vendors.mjs          # One-time Firestore seed (firebase-admin)
├── service/                      # Cloud Run FastAPI service
│   ├── app.py                    # /vendors/api/spend endpoint (boto3 Cost Explorer)
│   ├── Dockerfile
│   └── requirements.txt
├── src/                          # React + Vite SPA (TypeScript)
│   ├── auth/                     # Firebase Auth gate (platform-delegated sign-in)
│   │   ├── accessPolicy.ts       # RBAC + fetchUserDoc (imports shared helpers from @haderach/shared-ui)
│   │   ├── AuthGate.tsx
│   │   ├── AuthUserContext.ts
│   │   └── runtimeConfig.ts
│   ├── App.tsx                   # Root component (GlobalNav + Sidebar layout)
    │   ├── SpendChart.tsx            # Recharts stacked BarChart
    │   ├── SpendDataView.tsx         # Tabbed container (Chart | Table toggle)
    │   ├── SpendTable.tsx            # Pivot table (vendors × months)
    │   ├── SpendToolbar.tsx          # Dept/vendor/date filters toolbar
    │   ├── VendorDetail.tsx          # Vendor detail dialog (view + edit modal)
    │   ├── VendorList.tsx            # Vendor metadata table
    │   ├── fetchVendorSpend.ts       # Spend data fetcher (agentFetch → /agent/api/spend)
    │   ├── groupSpendRows.ts         # Spend data grouping/pivot helpers
    │   ├── index.css                 # Theme tokens + sidebar tokens
    │   ├── main.tsx
    │   ├── spend-columns.tsx         # Dynamic spend column definitions
    │   ├── types.ts                  # Vendor + spend types
    │   ├── useVendors.ts             # Vendor list fetcher (agentFetch → /agent/api/vendors)
    │   ├── vendor-columns.tsx        # Vendor table column definitions
    │   └── vite-env.d.ts
├── .env.example
├── .gitignore
├── firebase.json                 # Hosting config (headers, rewrites, emulator)
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
2. The agent service reads the Firestore `vendors` collection server-side and returns the list
3. Vendor list, filters, and detail dialog are driven by the fetched data

### Spend data (on-demand)

1. User selects vendors and date range in the toolbar
2. Frontend calls `agentFetch('/spend?vendors=aws&from=YYYY-MM-DD&to=YYYY-MM-DD', getIdToken)`
3. Agent service calls AWS Cost Explorer (`ce.get_cost_and_usage`) server-side
4. Returns `{ data: [{ vendor, month, amount }] }`
5. Frontend renders stacked bar chart and pivot table

### Vendor mutations

1. Edits go through `agentFetch('/vendors/:id', getIdToken, { method: 'PATCH', body })` 
2. Deletes go through `agentFetch('/vendors/:id', getIdToken, { method: 'DELETE' })`
3. The agent service handles all Firestore writes server-side

## Firestore Schema

### `vendors/{vendorId}`

Each document mirrors the `VendorInfo` interface from `types.ts`:

| Field | Type | Required |
|-------|------|----------|
| `id` | string | yes |
| `name` | string | yes |
| `category` | string | yes |
| `status` | `active` \| `inactive` \| `trial` | yes |
| `billingCycle` | `monthly` \| `annual` \| `usage-based` | yes |
| `paymentMethod` | `credit-card` \| `invoice` \| `ach` \| `wire` | yes |
| `contractRenews` | string (ISO date) | no |
| `billingAdmin` | string | no |
| `michaelAdded` | boolean | no |
| `website`, `loginUrl`, etc. | string | no |

Firestore rules (in `haderach-platform/firestore.rules`): authenticated reads allowed, client writes denied. Admin writes via Admin SDK or Firebase Console.

## Chat UI

The vendors app includes an embedded chat panel (`ChatPanel` from `@haderach/shared-ui`) that communicates with the shared agent service at `/agent/api/chat`. The panel is toggled via a floating button (`ChatToggle` from `@haderach/shared-ui`). The agent can add, modify, delete, and query vendor records in Firestore via OpenAI tool-calling. The `modify_vendor` tool opens the vendor detail modal in edit mode; the user edits fields and saves via `PATCH /agent/api/vendors/:id`.

All requests to the agent service include a Firebase ID token via `Authorization: Bearer <idToken>`. The `agentFetch` helper (from `@haderach/shared-ui`) obtains the token via `getIdToken()` and attaches it to every request. The agent service verifies the token server-side and rejects unauthenticated calls with HTTP 401. This same mechanism is used for user doc resolution: `fetchUserDoc` calls `GET /agent/api/me` to retrieve roles and profile data (replacing earlier direct Firestore reads).

### Authentication

Authentication is centralized at the platform level. Auth primitives (`buildDisplayName`) and RBAC helpers (`APP_CATALOG`, `APP_GRANTING_ROLES`, `hasAppAccess`, `getAccessibleApps`) are imported from `@haderach/shared-ui`. `AuthUser` extends `BaseAuthUser` (from shared-ui) with vendor-specific fields (`allowedDepartments`, `allowedVendorIds`, `deniedVendorIds`, `isFinanceAdmin`). The vendor-extended `fetchUserDoc` is kept locally since it returns additional spend-filtering fields.

In production, unauthenticated users are redirected to `/?returnTo=/vendors/` for platform sign-in. In local dev (`import.meta.env.DEV`), the app shows a dev-only "Sign in with Google" button instead of redirecting, allowing authentication directly on the app's origin without requiring haderach-home to be running.

### Spend queries via chat

The agent can answer live spend questions (e.g. "What's my AWS spend this month?") using the `execute_python` tool. Instead of per-vendor fetcher code, the LLM generates Python at runtime to call billing APIs (boto3 Cost Explorer, etc.) in a sandboxed executor (`agent/service/sandbox.py`). Credentials are available via environment variables — never surfaced in prompts or outputs. The sandbox restricts imports to an allowlist (`boto3`, `json`, `os`, `datetime`, etc.) and enforces a 30-second timeout.

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
Partial-update a vendor document. Body is a JSON object of fields to update. Returns the full vendor document after update.

### `DELETE /agent/api/vendors/:vendor_id`

Requires `Authorization: Bearer <idToken>`.
Delete a vendor document (called after user confirms deletion in the UI).

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

In auth-bypass mode, the app skips sign-in and renders with mock user data. No agent service or Firestore connection is needed.

### Seeding vendor data

```bash
npm install --no-save firebase-admin
node scripts/seed-vendors.mjs                        # dry-run
node scripts/seed-vendors.mjs --project haderach-ai   # write to Firestore
```

## Deployment

Same artifact-based pattern as stocks:
- SPA: `npm run build` → `dist/vendors/` → platform promotion
- API: Docker → Artifact Registry → Cloud Run as `vendors-api`
