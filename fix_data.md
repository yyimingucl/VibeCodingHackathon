# Role: Backend Data Engineer
# Context: Hackathon MVP. The API is working, but we have two critical data quality issues from Google Routes API: duplicate routes and unrealistic London fares.

## Task
Update the `fetch_google_routes` function in `backend/services/google_api.py` (or wherever parsing happens) to fix these two bugs before returning the `List[RouteOption]`.

### Fix 1: Route Deduplication (Fingerprinting)
Google often returns multiple routes that use the exact same transit lines (just different departure times). We only want unique path choices.
**Logic**:
1. For each parsed route, generate a `route_signature` string based ONLY on its transit steps.
   - Example format: `TUBE:Piccadilly -> BUS:14 -> WALK`
2. Create an empty dictionary `unique_routes = {}`.
3. Loop through the parsed routes. If the `route_signature` is NOT in `unique_routes`, add it. If it IS in `unique_routes`, keep the one with the shorter `duration_min`.
4. Return only the values of `unique_routes`.

### Fix 2: Smart London Fare Heuristic (TfL Pricing)
Our previous time-based fare imputation was too naive. Replace the missing fare logic with this realistic London (TfL) heuristic.
**Logic**:
Check the parsed `fare_gbp` from Google. If it exists and is > 0, keep it. 
If it is `None`, `0`, or missing, calculate a fallback based on the `steps`:
1. **Walk Only**: If all steps are "WALK", `fare_gbp = 0.0`.
2. **Bus Only**: If the route has "BUS" but NO "TUBE", "SUBWAY", "TRAIN", or "HEAVY_RAIL", set `fare_gbp = 1.75` (Standard TfL Hopper fare).
3. **Tube/Rail Involved**: If the route contains "TUBE", "SUBWAY", "UNDERGROUND", or "TRAIN":
   - Base fare = `2.80` (Typical Zone 1-2 fare).
   - Add distance penalty: If total `duration_min` > 30, add `(duration_min - 30) * 0.05` to the fare.
   - Set this calculated value to `fare_gbp`.

**Action**: Implement these two filters in the backend codebase immediately. Ensure it returns a clean, deduplicated `List[RouteOption]` with realistic GBP prices. Do not break the existing JSON contract.