export interface Preferences {
  budget_friendly: boolean;
  lazy_walk: boolean;
  easy_transfer: boolean;
  accessibility: boolean;
  pet_friendly: boolean;
}

export interface RouteRequest {
  origin: string;
  destination: string;
  depart_time_iso: string;
  preferences: Preferences;
}

export interface RouteStep {
  mode: string;
  line: string;
  from_stop: string;
  to_stop: string;
  duration_min: number;
}

export interface RouteFeatures {
  duration_min: number;
  fare_gbp: number;
  walk_min: number;
  transfers: number;
}

export interface RouteOption {
  id: string;
  summary: string;
  duration_min: number;
  fare_gbp: number | null;
  walk_min: number;
  transfers: number;
  steps: RouteStep[];
  features: RouteFeatures;
  score: number;
  why: string | null;
}
