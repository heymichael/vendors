# Vendor Spend Management — Architecture

## Overview

The vendors app tracks monthly spend across software vendors (AWS, Cursor, GCS, etc.). It follows the same SPA + backend service pattern as the stocks app. Vendor metadata is stored in Firestore and streamed to the UI in real-time via `onSnapshot`.

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
│   │   ├── accessPolicy.ts       # RBAC (imports catalog from @haderach/shared-ui)
│   │   ├── AuthGate.tsx
│   │   ├── AuthUserContext.ts
│   │   └── runtimeConfig.ts
│   ├── components/
│   │   └── ui/
│   │       └── dialog.tsx        # Radix Dialog (center modal)
│   ├── App.tsx                   # Root component (GlobalNav + Sidebar layout)
│   ├── App.css                   # Shell layout and sidebar positioning
│   ├── ChatPanel.tsx             # Agent chat panel (calls /agent/api/chat)
│   ├── ChatToggle.tsx            # Floating button to open/close chat
│   ├── Controls.tsx              # Vendor + date filters (embedded in Sidebar)
│   ├── SpendChart.tsx            # Recharts stacked BarChart
│   ├── SpendDataView.tsx         # Tabbed container (Chart | Table toggle)
│   ├── SpendTable.tsx            # Pivot table (vendors × months)
│   ├── VendorDetail.tsx          # Vendor detail dialog (view + edit modal)
│   ├── VendorFilters.tsx         # Category + vendor multi-select filters
│   ├── VendorList.tsx            # Vendor metadata table
│   ├── index.css                 # Theme tokens + sidebar tokens
│   ├── main.tsx
│   ├── spend-columns.tsx         # Dynamic spend column definitions
│   ├── types.ts                  # Vendor + spend types
│   ├── useVendors.ts             # Real-time Firestore vendor subscription
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

### Vendor metadata (real-time)

1. `useVendors` hook subscribes to the Firestore `vendors` collection via `onSnapshot`
2. Vendor list, filters, and detail dialog are driven by live data
3. In auth-bypass mode, the hook initializes Firebase and signs in anonymously

### Spend data (on-demand)

1. User selects vendors and date range in sidebar, clicks Fetch
2. Frontend calls `GET /vendors/api/spend?vendors=aws&from=YYYY-MM-DD&to=YYYY-MM-DD`
3. FastAPI backend calls AWS Cost Explorer (`ce.get_cost_and_usage`)
4. Backend returns `{ data: [{ vendor, month, amount }] }`
5. Frontend renders stacked bar chart and pivot table

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

The vendors app includes an embedded chat panel (`ChatPanel.tsx`) that communicates with the shared agent service at `/agent/api/chat`. The panel is toggled via a floating button (`ChatToggle.tsx`). The agent can add, modify, delete, and query vendor records in Firestore via OpenAI tool-calling. The `modify_vendor` tool opens the vendor detail modal in edit mode; the user edits fields and saves via `PATCH /agent/api/vendors/:id`.

All requests to the agent service include a Firebase ID token via `Authorization: Bearer <idToken>`. The `agentFetch.ts` helper obtains the token from `firebase.auth().currentUser.getIdToken()` and attaches it to every request. The agent service verifies the token server-side and rejects unauthenticated calls with HTTP 401.

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

In auth-bypass mode, the `useVendors` hook signs in anonymously to satisfy Firestore rules. Anonymous auth must be enabled in the Firebase project.

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
