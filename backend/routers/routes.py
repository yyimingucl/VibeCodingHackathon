from fastapi import APIRouter, HTTPException

from schemas import RouteRankRequest, RouteOption
from services.google_api import fetch_google_routes
from core.ranking import rank_routes

router = APIRouter(prefix="/api/routes", tags=["routes"])


@router.post("/raw", response_model=list[RouteOption])
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


@router.post("/rank", response_model=list[RouteOption])
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
