# Vendor Spend Management

Track monthly spend across software vendors (AWS, Cursor, GCS, etc.) with a stacked bar chart and pivot table view.

## Quick Start

```bash
# Install dependencies
npm install

# Copy env file and fill in credentials
cp .env.example .env

# Start the backend (in a separate terminal)
cd service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --port 5002

# Start the frontend
npm run dev
```

## Repo layout

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
│   └── seed-vendors.mjs
├── service/
│   ├── app.py
│   ├── Dockerfile
│   └── requirements.txt
├── src/
│   ├── auth/
│   │   ├── accessPolicy.ts
│   │   ├── AuthGate.tsx
│   │   ├── AuthUserContext.ts
│   │   └── runtimeConfig.ts
│   ├── components/
│   │   └── ui/
│   │       └── dialog.tsx
│   ├── App.tsx
│   ├── App.css
│   ├── ChatPanel.tsx
│   ├── ChatToggle.tsx
│   ├── Controls.tsx
│   ├── SpendChart.tsx
│   ├── SpendDataView.tsx
│   ├── SpendTable.tsx
│   ├── VendorDetail.tsx
│   ├── VendorFilters.tsx
│   ├── VendorList.tsx
│   ├── index.css
│   ├── main.tsx
│   ├── spend-columns.tsx
│   ├── types.ts
│   ├── useVendors.ts
│   ├── vendor-columns.tsx
│   └── vite-env.d.ts
├── .env.example
├── .gitignore
├── firebase.json
├── index.html
├── package-lock.json
├── package.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

## Architecture

See [docs/architecture.md](docs/architecture.md) for full details.
