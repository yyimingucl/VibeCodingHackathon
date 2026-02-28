"""
Fare lookup module backed by backend/data/fares.json.

In production, fares.json is refreshed by a monthly cron job:
  - GitHub Actions `schedule` trigger (cron: '0 3 1 * *')  — or —
  - AWS EventBridge rule targeting this backend's POST /api/admin/fares/sync endpoint.
Keeping fares in a JSON file (rather than hardcoded Python dicts) means zero redeploys
for routine price updates.
"""

import json
from pathlib import Path

_FARES_PATH = Path(__file__).parent.parent / "data" / "fares.json"


def _load_fares() -> dict:
    """Read fares.json from disk. Always reads fresh so updates are picked up."""
    with open(_FARES_PATH, "r") as f:
        return json.load(f)


def calculate_accurate_fare(summary: str, steps: list[dict]) -> float | None:
    """
    Look up the estimated fare for a route based on its transit lines.
    Returns a float (GBP) or None if fare cannot be determined.

    Matching priority:
      1. Heathrow Express (premium, line-specific)
      2. Elizabeth Line
      3. DLR
      4. Overground
      5. National Rail keywords
      6. Generic Tube (zone 1 default)
      7. Bus only routes
      8. None (walk-only or unknown)
    """
    fares = _load_fares()

    lines_in_route = [
        (s.get("line") or "").lower()
        for s in steps
        if s.get("mode") == "TRANSIT"
    ]
    summary_lower = summary.lower()

    if not lines_in_route:
        return None  # Walk-only route

    # 1. Heathrow Express
    if any("heathrow express" in l for l in lines_in_route):
        return fares["heathrow_express"]["heathrow_paddington"]

    # 2. Elizabeth Line
    if any("elizabeth" in l for l in lines_in_route):
        if "heathrow" in summary_lower:
            return fares["elizabeth_line"]["zone_1_6_heathrow"]
        return fares["elizabeth_line"]["zone_1_2"]

    # 3. DLR
    if any("dlr" in l or "docklands" in l for l in lines_in_route):
        return fares["dlr"]["zone_1_2"]

    # 4. London Overground
    if any("overground" in l for l in lines_in_route):
        return fares["overground"]["zone_1_2"]

    # 5. National Rail
    if any(k in summary_lower for k in ["national rail", "southeastern", "southern", "thameslink", "great western"]):
        return fares["national_rail"]["short"]

    # 6. Bus only
    if all("bus" in l or l.startswith("n") or l.isdigit() for l in lines_in_route):
        return fares["bus"]["default"]

    # 7. Tube fallback — use zone 1 single fare as default
    if any(lines_in_route):
        transfers = sum(1 for s in steps if s.get("mode") == "TRANSIT")
        if transfers >= 2:
            return fares["tube"]["zone_1_2"]
        return fares["tube"]["zone_1"]

    return None
