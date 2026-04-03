import json
import os
import re
from datetime import date as dt_date

import boto3
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(title="Vendors API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://docs.haderach.ai"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")

VENDOR_FETCHERS = {"aws"}


def _load_vendor_credentials(vendor_id: str) -> dict:
    """Load and parse VENDOR_<ID>_CREDENTIALS JSON from environment."""
    env_key = f"VENDOR_{vendor_id.upper()}_CREDENTIALS"
    raw = os.environ.get(env_key, "").strip()
    if not raw:
        raise ValueError(f"{env_key} is not set")
    return json.loads(raw)


def _get_ce_client():
    creds = _load_vendor_credentials("AWS_BILLING")
    return boto3.client(
        "ce",
        aws_access_key_id=creds["access_key_id"],
        aws_secret_access_key=creds["secret_access_key"],
        region_name=creds.get("region", "us-east-1"),
    )


def _fetch_aws_spend(date_from: str, date_to: str) -> list[dict]:
    """Fetch aggregate monthly spend from AWS Cost Explorer."""
    ce = _get_ce_client()

    # Cost Explorer end date is exclusive; snap to first of next month
    d_to = dt_date.fromisoformat(date_to)
    if d_to.day != 1:
        if d_to.month == 12:
            end_exclusive = dt_date(d_to.year + 1, 1, 1)
        else:
            end_exclusive = dt_date(d_to.year, d_to.month + 1, 1)
    else:
        end_exclusive = d_to

    # Snap from-date to first of its month
    d_from = dt_date.fromisoformat(date_from)
    start = dt_date(d_from.year, d_from.month, 1)

    response = ce.get_cost_and_usage(
        TimePeriod={
            "Start": start.isoformat(),
            "End": end_exclusive.isoformat(),
        },
        Granularity="MONTHLY",
        Metrics=["UnblendedCost"],
    )

    rows = []
    for period in response.get("ResultsByTime", []):
        month = period["TimePeriod"]["Start"][:7]
        amount_str = period.get("Total", {}).get("UnblendedCost", {}).get("Amount", "0")
        amount = round(float(amount_str), 2)
        rows.append({"vendor": "AWS", "month": month, "amount": amount})

    return rows


@app.get("/vendors/api/health")
async def health():
    return {"status": "ok"}


@app.get("/vendors/api/spend")
async def spend(
    vendors: str = "",
    date_from: str = Query("", alias="from"),
    date_to: str = Query("", alias="to"),
):
    requested = [v.strip().lower() for v in vendors.split(",") if v.strip()]
    if not requested:
        return JSONResponse(
            {"error": "Missing vendors",
             "details": "Provide at least one vendor via the 'vendors' query param."},
            status_code=400,
        )

    unsupported = [v for v in requested if v not in VENDOR_FETCHERS]
    if unsupported:
        return JSONResponse(
            {"error": "Unsupported vendor(s)",
             "details": f"Unsupported: {', '.join(unsupported)}. Supported: {', '.join(sorted(VENDOR_FETCHERS))}"},
            status_code=400,
        )

    date_from = date_from.strip()
    date_to = date_to.strip()

    if not date_from or not DATE_PATTERN.match(date_from):
        return JSONResponse(
            {"error": "Invalid 'from' date",
             "details": "'from' is required and must be YYYY-MM-DD."},
            status_code=400,
        )
    if not date_to or not DATE_PATTERN.match(date_to):
        return JSONResponse(
            {"error": "Invalid 'to' date",
             "details": "'to' is required and must be YYYY-MM-DD."},
            status_code=400,
        )
    if date_from > date_to:
        return JSONResponse(
            {"error": "Invalid date range",
             "details": "'from' must be <= 'to'."},
            status_code=400,
        )

    all_rows: list[dict] = []

    for vendor in requested:
        if vendor == "aws":
            try:
                rows = _fetch_aws_spend(date_from, date_to)
                all_rows.extend(rows)
            except Exception as exc:
                return JSONResponse(
                    {"error": f"Failed to fetch {vendor} data",
                     "details": str(exc)},
                    status_code=502,
                )

    return {
        "vendors": requested,
        "from": date_from,
        "to": date_to,
        "data": all_rows,
    }
