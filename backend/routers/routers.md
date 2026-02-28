# Role: FastAPI Backend Developer
# Context: Build the API routing layer.

## Task
Create the FastAPI router in `backend/routers/routes.py` and define the necessary Pydantic models in `backend/schemas.py`.

## 1. Pydantic Models (`schemas.py`)
Define the following strict schemas to match our JSON contract exactly:

**Input Request Model (`RouteRankRequest`)**:
- `origin`: str
- `destination`: str
- `depart_time_iso`: str
- `preferences`: dict containing boolean values for keys: `budget_friendly`, `lazy_walk`, `easy_transfer`, `accessibility`, `pet_friendly` (all default to False)
- `constraints`: Optional dict with `max_walk_min`, `max_fare_gbp`, `max_transfers`

**Output Response Model (`RouteOption`)**:
- `id`: str
- `summary`: str
- `duration_min`: float
- `fare_gbp`: Optional[float]
- `walk_min`: float
- `transfers`: int
- `steps`: List of dicts `{"mode": str, "line": str, "from": str, "to": str, "duration_min": float}`
- `features`: dict with `duration_min`, `fare_gbp`, `walk_min`, `transfers`
- `score`: float (default 0.0)
- `pareto`: bool (default False)
- `why`: Optional[str]

## 2. API Endpoints (`routers/routes.py`)
Create an `APIRouter` with two POST endpoints:

1. `POST /api/routes/raw`
   - Accepts `RouteRankRequest`.
   - Calls the `fetch_google_routes` function from `services.google_api` (assume it exists and returns a List of `RouteOption` with base stats, score=0, pareto=False).
   - Returns the List of `RouteOption`.

2. `POST /api/routes/rank`
   - Accepts `RouteRankRequest`.
   - Step 1: Calls `fetch_google_routes` to get the raw routes.
   - Step 2: Passes the raw routes, `preferences`, and `constraints` to `rank_routes` function from `core.ranking` (assume it exists).
   - Step 3: Returns the modified and sorted List of `RouteOption`.

**Constraints for Claude**: 
Keep it clean. Use standard FastAPI dependency injection and error handling (HTTPException for 500s).