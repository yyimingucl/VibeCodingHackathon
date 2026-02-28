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


def _route_signature(raw_steps: list[dict]) -> str:
    """Fingerprint a route by its sequence of transit lines (ignores timing, keeps path)."""
    parts = []
    for step in raw_steps:
        mode = step.get("travelMode", "WALK")
        if mode == "WALK":
            parts.append("WALK")
        else:
            line_name = (
                step.get("transitDetails", {})
                    .get("transitLine", {})
                    .get("name", "TRANSIT")
            )
            parts.append(f"TRANSIT:{line_name}")
    return " -> ".join(parts)


_RAIL_TYPES = {
    "SUBWAY", "HEAVY_RAIL", "RAIL", "METRO_RAIL",
    "COMMUTER_TRAIN", "HIGH_SPEED_TRAIN", "LONG_DISTANCE_TRAIN", "TRAM",
}
_BUS_TYPES = {"BUS", "INTERCITY_BUS", "TROLLEYBUS"}


def _impute_fare(raw_steps: list[dict], duration_min: float) -> float:
    """
    TfL-realistic fare heuristic when Google returns no fare data.
    - Walk only  → £0.00
    - Bus only   → £1.75 (Hopper flat fare)
    - Tube/Rail  → £2.80 base + £0.05/min over 30 min
    """
    transit_steps = [s for s in raw_steps if s.get("travelMode") != "WALK"]

    if not transit_steps:
        return 0.0

    vehicle_types = {
        s.get("transitDetails", {})
         .get("transitLine", {})
         .get("vehicle", {})
         .get("type", "")
         .upper()
        for s in transit_steps
    }

    has_rail = bool(vehicle_types & _RAIL_TYPES)
    has_bus = bool(vehicle_types & _BUS_TYPES)

    if has_bus and not has_rail:
        return 1.75

    if has_rail:
        base = 2.80
        if duration_min > 30:
            base += round((duration_min - 30) * 0.05, 2)
        return round(base, 2)

    # Unknown vehicle type — use zone-1 tube fare as safe default
    return 2.80


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

    # unique_routes: signature -> RouteOption (keeps shortest duration per path)
    unique_routes: dict[str, RouteOption] = {}

    for i, route in enumerate(routes_raw):
        try:
            # Duration
            duration_str = route.get("duration", "0s")
            duration_min = _parse_duration_seconds(duration_str)

            # Fare — keep Google's value if > 0, otherwise use TfL heuristic
            advisory = route.get("travelAdvisory", {})
            fare_raw = advisory.get("transitFare", {}).get("value")
            google_fare: Optional[float] = float(fare_raw) if fare_raw is not None else None

            # Steps
            legs = route.get("legs", [{}])
            raw_steps = legs[0].get("steps", []) if legs else []

            # Deduplication fingerprint (computed from raw Google steps)
            signature = _route_signature(raw_steps)

            # Skip if we already have this path with a shorter duration
            existing = unique_routes.get(signature)
            if existing and existing.duration_min <= round(duration_min, 1):
                continue

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
                line_name = transit_details.get("transitLine", {}).get("name", "")

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

            # Smart fare: use Google's value if valid, else TfL heuristic
            if google_fare and google_fare > 0:
                fare_gbp = google_fare
            else:
                fare_gbp = _impute_fare(raw_steps, duration_min)

            route_id = _make_id(signature)

            unique_routes[signature] = RouteOption(
                id=route_id,
                summary=summary,
                duration_min=round(duration_min, 1),
                fare_gbp=round(fare_gbp, 2),
                walk_min=round(walk_min, 1),
                transfers=transfers,
                steps=steps,
                features=RouteFeatures(
                    duration_min=round(duration_min, 1),
                    fare_gbp=round(fare_gbp, 2),
                    walk_min=round(walk_min, 1),
                    transfers=transfers,
                ),
                score=0.0,
                why=None,
            )
        except Exception:
            continue

    return list(unique_routes.values())


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
