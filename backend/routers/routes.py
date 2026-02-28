import json
import os
import random
from pathlib import Path

import httpx
from fastapi import APIRouter, HTTPException, Header, Query
from typing import Annotated

from schemas import RouteRankRequest, RouteOption
from services.google_api import fetch_google_routes
from core.ranking import rank_routes

router = APIRouter(tags=["routes"])

_FARES_PATH = Path(__file__).parent.parent / "data" / "fares.json"
_ADMIN_KEY = "hackathon2026"


@router.get("/api/places/autocomplete", response_model=list[str])
async def places_autocomplete(q: str = Query(min_length=1)) -> list[str]:
    """
    Proxy Google Places Autocomplete, biased to London, UK only.
    Returns a list of place description strings. Returns [] on any error
    so the frontend never breaks.
    """
    api_key = os.getenv("Maps_API_KEY", "")
    if not api_key:
        print("[places/autocomplete] Maps_API_KEY not found in environment")
        return []

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                "https://maps.googleapis.com/maps/api/place/autocomplete/json",
                params={
                    "input": q,
                    "key": api_key,
                    "components": "country:gb",
                    "location": "51.5074,-0.1278",
                    "radius": "30000",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        print(f"[places/autocomplete] status={data.get('status')} predictions={len(data.get('predictions', []))}")
        return [p["description"] for p in data.get("predictions", [])]
    except Exception as e:
        print(f"[places/autocomplete] error: {e}")
        return []


@router.post("/api/routes/raw", response_model=list[RouteOption])
async def get_raw_routes(request: RouteRankRequest) -> list[RouteOption]:
    try:
        routes = await fetch_google_routes(
            origin=request.origin,
            destination=request.destination,
            depart_time=request.depart_time_iso,
        )
        return routes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/routes/rank", response_model=list[RouteOption])
async def get_ranked_routes(request: RouteRankRequest) -> list[RouteOption]:
    try:
        routes = await fetch_google_routes(
            origin=request.origin,
            destination=request.destination,
            depart_time=request.depart_time_iso,
        )
        ranked = rank_routes(
            routes=routes,
            preferences=request.preferences.model_dump(),
            constraints=request.constraints.model_dump() if request.constraints else None,
        )
        return ranked
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Admin endpoint: POST /api/admin/fares/sync
#
# In production this endpoint is called by a Monthly Cron Job:
#   - GitHub Actions `schedule` (cron: '0 3 1 * *')  — or —
#   - AWS EventBridge rule (rate: 1 month)
# It simulates a real-world fare sync (e.g., TfL API / Trainline scrape)
# by applying a small inflation to all numeric fare values and writing the
# updated data back to fares.json — no redeploy required.
# ---------------------------------------------------------------------------

@router.post("/api/admin/fares/sync")
async def sync_fares(x_admin_key: Annotated[str | None, Header()] = None):
    if x_admin_key != _ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Invalid or missing X-Admin-Key header.")

    try:
        with open(_FARES_PATH, "r") as f:
            fares = json.load(f)

        # Simulate monthly update: apply 1–2% inflation to all numeric fare values
        inflation = round(random.uniform(1.01, 1.02), 4)

        def _inflate(obj):
            if isinstance(obj, dict):
                return {k: _inflate(v) for k, v in obj.items()}
            if isinstance(obj, (int, float)) and not isinstance(obj, bool):
                return round(obj * inflation, 2)
            return obj

        updated = {
            k: (_inflate(v) if k != "_comment" else v)
            for k, v in fares.items()
        }

        with open(_FARES_PATH, "w") as f:
            json.dump(updated, f, indent=2)

        return {
            "status": "ok",
            "inflation_applied": f"{round((inflation - 1) * 100, 2)}%",
            "updated_fares": updated,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
