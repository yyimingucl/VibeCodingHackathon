from typing import Optional
from pydantic import BaseModel, Field


class UserPreferences(BaseModel):
    budget_friendly: bool = False
    lazy_walk: bool = False
    easy_transfer: bool = False
    accessibility: bool = False
    pet_friendly: bool = False
    speed_first: bool = False
    cycle2work: bool = False
    scenic_bus: bool = False
    scenic_boat: bool = False


class RouteConstraints(BaseModel):
    max_walk_min: float = 0.0
    max_fare_gbp: float = 0.0
    max_transfers: int = 0


class RouteRankRequest(BaseModel):
    origin: str
    destination: str
    depart_time_iso: str
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    constraints: Optional[RouteConstraints] = None


class RouteStep(BaseModel):
    mode: str
    line: str
    from_stop: str = Field(alias="from_stop")
    to_stop: str = Field(alias="to_stop")
    duration_min: float


class RouteFeatures(BaseModel):
    duration_min: float
    fare_gbp: float
    walk_min: float
    transfers: int


class RouteOption(BaseModel):
    id: str
    summary: str
    duration_min: float
    fare_gbp: Optional[float]
    walk_min: float
    transfers: int
    steps: list[RouteStep]
    features: RouteFeatures
    score: float = 0.0
    why: Optional[str] = None

    class Config:
        populate_by_name = True


class VoiceIntentRequest(BaseModel):
    text: str
