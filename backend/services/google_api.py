import os
import hashlib
import re
from typing import Optional
import httpx

from schemas import RouteOption, RouteStep, RouteFeatures

GOOGLE_ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes"
FIELD_MASK = "routes.routeLabels,routes.duration,routes.legs.steps,routes.travelAdvisory"


def _parse_duration_seconds(duration_str: str) -> float:
    """Parse Google's '1500s' format to minutes."""
    match = re.match(r"(\d+)s", str(duration_str))
    return int(match.group(1)) / 60.0 if match else 0.0


def _make_id(*parts: str) -> str:
    return hashlib.md5("-".join(parts).encode()).hexdigest()[:12]


def _build_mock_routes() -> list[RouteOption]:
    return [
        RouteOption(
            id=_make_id("fast-tube"),
            summary="Walk + Tube (Piccadilly) + Elizabeth Line + Walk",
            duration_min=32.0,
            fare_gbp=4.50,
            walk_min=6.0,
            transfers=1,
            steps=[
                RouteStep(mode="WALK", line="", from_stop="Origin", to_stop="King's Cross St. Pancras", duration_min=3.0),
                RouteStep(mode="TRANSIT", line="Piccadilly", from_stop="King's Cross St. Pancras", to_stop="Paddington", duration_min=18.0),
                RouteStep(mode="TRANSIT", line="Elizabeth", from_stop="Paddington", to_stop="Destination Station", duration_min=8.0),
                RouteStep(mode="WALK", line="", from_stop="Destination Station", to_stop="Destination", duration_min=3.0),
            ],
            features=RouteFeatures(duration_min=32.0, fare_gbp=4.50, walk_min=6.0, transfers=1),
            score=0.0,
            why=None,
        ),
        RouteOption(
            id=_make_id("slow-bus"),
            summary="Walk + Bus (N29) + Walk",
            duration_min=62.0,
            fare_gbp=1.75,
            walk_min=12.0,
            transfers=0,
            steps=[
                RouteStep(mode="WALK", line="", from_stop="Origin", to_stop="Bus Stop A", duration_min=5.0),
                RouteStep(mode="TRANSIT", line="N29", from_stop="Bus Stop A", to_stop="Bus Stop B", duration_min=50.0),
                RouteStep(mode="WALK", line="", from_stop="Bus Stop B", to_stop="Destination", duration_min=7.0),
            ],
            features=RouteFeatures(duration_min=62.0, fare_gbp=1.75, walk_min=12.0, transfers=0),
            score=0.0,
            why=None,
        ),
        RouteOption(
            id=_make_id("balanced-tube-walk"),
            summary="Walk + Tube (Central) + Walk",
            duration_min=45.0,
            fare_gbp=2.80,
            walk_min=16.0,
            transfers=0,
            steps=[
                RouteStep(mode="WALK", line="", from_stop="Origin", to_stop="Holborn", duration_min=8.0),
                RouteStep(mode="TRANSIT", line="Central", from_stop="Holborn", to_stop="Destination Station", duration_min=29.0),
                RouteStep(mode="WALK", line="", from_stop="Destination Station", to_stop="Destination", duration_min=8.0),
            ],
            features=RouteFeatures(duration_min=45.0, fare_gbp=2.80, walk_min=16.0, transfers=0),
            score=0.0,
            why=None,
        ),
    ]


def _parse_routes(data: dict) -> list[RouteOption]:
    routes_raw = data.get("routes", [])
    results: list[RouteOption] = []

    for i, route in enumerate(routes_raw):
        try:
            # Duration
            duration_str = route.get("duration", "0s")
            duration_min = _parse_duration_seconds(duration_str)

            # Fare
            advisory = route.get("travelAdvisory", {})
            fare_raw = advisory.get("transitFare", {}).get("value")
            fare_gbp: Optional[float] = float(fare_raw) if fare_raw is not None else None

            # Steps
            legs = route.get("legs", [{}])
            raw_steps = legs[0].get("steps", []) if legs else []

            steps: list[RouteStep] = []
            walk_min = 0.0
            transit_count = 0

            for step in raw_steps:
                mode = step.get("travelMode", "WALK")
                step_dur = _parse_duration_seconds(step.get("duration", "0s"))

                transit_details = step.get("transitDetails", {})
                stop_details = transit_details.get("stopDetails", {})
                from_stop = stop_details.get("departureStop", {}).get("name", "")
                to_stop = stop_details.get("arrivalStop", {}).get("name", "")
                line_name = (
                    transit_details.get("transitLine", {})
                    .get("name", "")
                )

                if mode == "WALK":
                    walk_min += step_dur
                    from_stop = from_stop or "Walk start"
                    to_stop = to_stop or "Walk end"
                else:
                    transit_count += 1

                steps.append(RouteStep(
                    mode=mode,
                    line=line_name,
                    from_stop=from_stop,
                    to_stop=to_stop,
                    duration_min=round(step_dur, 1),
                ))

            transfers = max(0, transit_count - 1)

            # Summary
            mode_parts = []
            for s in steps:
                if s.mode == "WALK":
                    if not mode_parts or mode_parts[-1] != "Walk":
                        mode_parts.append("Walk")
                else:
                    label = f"Tube ({s.line})" if s.line else "Transit"
                    mode_parts.append(label)
            summary = " + ".join(mode_parts) if mode_parts else "Transit"

            route_id = _make_id(str(i), summary, str(duration_min))
            fare_for_features = fare_gbp if fare_gbp is not None else round(duration_min * 0.15 * 1.2, 2)

            results.append(RouteOption(
                id=route_id,
                summary=summary,
                duration_min=round(duration_min, 1),
                fare_gbp=fare_gbp,
                walk_min=round(walk_min, 1),
                transfers=transfers,
                steps=steps,
                features=RouteFeatures(
                    duration_min=round(duration_min, 1),
                    fare_gbp=fare_for_features,
                    walk_min=round(walk_min, 1),
                    transfers=transfers,
                ),
                score=0.0,
                why=None,
            ))
        except Exception:
            continue

    return results


async def fetch_google_routes(origin: str, destination: str, depart_time: str) -> list[RouteOption]:
    api_key = os.getenv("Maps_API_KEY", "")

    if not api_key:
        return _build_mock_routes()

    payload = {
        "origin": {"address": origin},
        "destination": {"address": destination},
        "travelMode": "TRANSIT",
        "computeAlternativeRoutes": True,
        "transitPreferences": {
            "routingPreference": "LESS_WALKING"
        },
    }

    headers = {
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": FIELD_MASK,
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(GOOGLE_ROUTES_URL, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        routes = _parse_routes(data)
        if not routes:
            return _build_mock_routes()
        return routes

    except Exception:
        return _build_mock_routes()
