import { RouteRequest, RouteOption, Preferences } from "@/types";

export interface VoiceIntentResult {
  origin: string;
  destination: string;
  preferences: Preferences;
}

const BACKEND_URL = "http://localhost:8001";

const MOCK_ROUTES: RouteOption[] = [
  {
    id: "mock-1",
    summary: "Tube (Central) + Walk",
    duration_min: 28,
    fare_gbp: 2.8,
    walk_min: 8,
    transfers: 0,
    steps: [
      { mode: "WALK", line: "", from_stop: "Origin", to_stop: "Holborn", duration_min: 4 },
      { mode: "TRANSIT", line: "Central", from_stop: "Holborn", to_stop: "Destination Station", duration_min: 20 },
      { mode: "WALK", line: "", from_stop: "Destination Station", to_stop: "Destination", duration_min: 4 },
    ],
    features: { duration_min: 28, fare_gbp: 2.8, walk_min: 8, transfers: 0 },
    score: 0.12,
    why: "Ranked #1 because it saves 17 mins compared to the next best option.",
  },
  {
    id: "mock-2",
    summary: "Bus (N29) + Walk",
    duration_min: 55,
    fare_gbp: 1.75,
    walk_min: 12,
    transfers: 0,
    steps: [
      { mode: "WALK", line: "", from_stop: "Origin", to_stop: "Bus Stop A", duration_min: 5 },
      { mode: "TRANSIT", line: "N29", from_stop: "Bus Stop A", to_stop: "Bus Stop B", duration_min: 45 },
      { mode: "WALK", line: "", from_stop: "Bus Stop B", to_stop: "Destination", duration_min: 5 },
    ],
    features: { duration_min: 55, fare_gbp: 1.75, walk_min: 12, transfers: 0 },
    score: 0.58,
    why: null,
  },
  {
    id: "mock-3",
    summary: "Walk + Tube (Piccadilly) + Elizabeth Line + Walk",
    duration_min: 42,
    fare_gbp: 4.5,
    walk_min: 6,
    transfers: 1,
    steps: [
      { mode: "WALK", line: "", from_stop: "Origin", to_stop: "King's Cross St. Pancras", duration_min: 3 },
      { mode: "TRANSIT", line: "Piccadilly", from_stop: "King's Cross St. Pancras", to_stop: "Paddington", duration_min: 20 },
      { mode: "TRANSIT", line: "Elizabeth", from_stop: "Paddington", to_stop: "Destination Station", duration_min: 15 },
      { mode: "WALK", line: "", from_stop: "Destination Station", to_stop: "Destination", duration_min: 4 },
    ],
    features: { duration_min: 42, fare_gbp: 4.5, walk_min: 6, transfers: 1 },
    score: 0.74,
    why: null,
  },
];

export async function fetchRankedRoutes(payload: RouteRequest): Promise<RouteOption[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/routes/rank`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data: RouteOption[] = await res.json();
    return data;
  } catch (err) {
    console.error("Backend unavailable, using mock data:", err);
    return MOCK_ROUTES;
  }
}

export async function fetchVoiceIntent(text: string): Promise<VoiceIntentResult | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/routes/voice-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("[voice-intent] fetch failed:", err);
    return null;
  }
}

export async function fetchVoiceSearch(audioBlob: Blob): Promise<VoiceIntentResult | null> {
  try {
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm");
    const res = await fetch(`${BACKEND_URL}/api/routes/voice-search`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("[voice-search] fetch failed:", err);
    return null;
  }
}
