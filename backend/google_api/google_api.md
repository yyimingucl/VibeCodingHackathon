# Role: API Integration Expert
# Context: Integrate Google Routes API (Transit mode).
# Goal: Write `backend/services/google_api.py`. The absolute rule is: NEVER crash the frontend. If the API fails, return mock data.

## Task
Implement the async function `fetch_google_routes(origin, destination, depart_time) -> List[RouteOption]`.

## 1. Google Routes API Call
- Use `httpx.AsyncClient`.
- URL: `https://routes.googleapis.com/directions/v2:computeRoutes`
- Headers must include:
  - `X-Goog-Api-Key`: from environment variable `Maps_API_KEY`
  - `X-Goog-FieldMask`: `routes.routeLabels,routes.duration,routes.legs.steps,routes.travelAdvisory`
- Payload:
  - `origin` and `destination` (handle as address strings for now).
  - `travelMode`: "TRANSIT"
  - `computeAlternativeRoutes`: true

## 2. Defensive JSON Parsing (CRITICAL)
Google's transit JSON is deeply nested. You MUST use `.get()` with default values to avoid `KeyError`.
For each route returned:
- `id`: Generate a quick hash or use uuid.
- `duration_min`: Parse `routes[i].duration` (convert "1500s" to minutes).
- `fare_gbp`: Extract from `travelAdvisory.transitFare.value` (if missing, return `None`).
- `steps`: Iterate through `legs[0].steps`.
  - Calculate `walk_min` by summing durations of steps where `travelMode == "WALK"`.
  - Count `transfers` as the number of "TRANSIT" steps minus 1 (if > 0).
  - Extract step details (mode, line name, departure stop, arrival stop).
- `summary`: Create a short string like "Walk + Tube (Piccadilly) + Walk".

## 3. The Fallback (Mock Data)
If the `Maps_API_KEY` is missing, the HTTP request fails, or 0 routes are returned, catch the exception and immediately return 3 hardcoded `RouteOption` objects representing London transit:
1. "The Fast & Expensive" (e.g., Tube + Elizabeth Line, fast, £4.50)
2. "The Slow & Cheap" (e.g., Bus only, very slow, £1.75)
3. "The Balanced" (e.g., Tube + Walk, medium time, £2.80)

**Constraints for Claude**: 
Output only `backend/services/google_api.py`. Import `RouteOption` from `schemas`. Make sure the output exactly matches the `RouteOption` schema structure.