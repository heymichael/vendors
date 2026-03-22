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

## Architecture

See [docs/architecture.md](docs/architecture.md) for full details.
