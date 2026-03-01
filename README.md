# Travelet

> **One day Hackathon MVP** — Travelet is an AI-native, intent-driven transit platform that eliminates commuter decision fatigue. We move beyond simply finding the "fastest" or "cheapest" route, instantly matching London journeys to your actual human context—your budget, your energy levels, and your vibe.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS v4, TypeScript 5 |
| Backend | Python FastAPI, Uvicorn, Pydantic v2 |
| Routing data | Google Routes API v2 |
| Place search | Google Places API (Autocomplete) |
| Voice input | NVIDIA Riva ASR (speech-to-text) |
| LLM intent | NVIDIA NIM — LLaMA 3.1 70B (extracts contexts from voice) |
| Icons | Lucide React |
| Export | html-to-image (shareable Travel Pass) |

---

## Prerequisites

- **Node.js** 18+ and **npm**
- **Python** 3.10+
- **pip**
- A **Google Cloud** project with the following APIs enabled:
  - Routes API (v2)
  - Places API (New)
  - Maps JavaScript API
- An **NVIDIA NIM** API key (for voice intent + ASR): https://build.nvidia.com

---

## Quick Start

### 1. Clone

```bash
git clone <repo-url>
cd VibeCodingHackathon
```

### 2. Configure environment variables

```bash
make setup
```

This copies the example env files. Then fill in your keys:

**`backend/.env`**
```env
Maps_API_KEY=your_google_maps_api_key_here
NVIDIA_API_KEY=your_nvidia_api_key_here
```

**`frontend/.env.local`**
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 3. Install dependencies

```bash
make install
```

Or separately:

```bash
make install-backend   # pip install -r backend/requirements.txt
make install-frontend  # npm install inside frontend/
```

### 4. Run

```bash
make dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

Or run each server independently:

```bash
make dev-backend    # FastAPI + uvicorn (hot reload)
make dev-frontend   # Next.js dev server
```

---

## How It Works

1. **Enter** origin and destination (type or speak)
2. **Toggle** your preferences — five boolean switches:
   - Budget Friendly · Lazy Walk · Easy Transfer · Accessibility · Pet Friendly
3. **Switch to Explore mode** for scenic/cycling options
4. **Ranker** fetches live transit options from Google Routes API, applies step-function penalties based on your toggles, and returns the ranked list
5. **Top result** includes a plain-English `why` explanation comparing it to the alternatives
6. **Export** your chosen route as a shareable Travel Pass image

---

## Project Structure

```
CCHackthon/
├── frontend/               # Next.js app
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # UI components (RouteCard, PreferenceToggles, …)
│   │   ├── lib/api.ts      # Backend API client + mock fallback
│   │   └── types/index.ts  # TypeScript interfaces
│   └── .env.local.example
├── backend/                # FastAPI app
│   ├── main.py             # App entry point + CORS
│   ├── schemas.py          # Pydantic models (single source of truth)
│   ├── core/ranking.py     # Scoring & explanation logic
│   ├── routers/routes.py   # API endpoints
│   ├── services/
│   │   ├── google_api.py   # Google Routes parsing + mock data
│   │   ├── llm_intent.py   # LLM voice intent extraction
│   │   └── asr.py          # NVIDIA Riva speech-to-text
│   ├── requirements.txt
│   └── .env.example
└── Makefile                # One-command install + run
```

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/routes/rank` | POST | Main endpoint — fetch + rank routes by preferences |
| `/api/routes/raw` | POST | Raw Google Transit data (unranked) |
| `/api/routes/voice-intent` | POST | Extract origin/dest/prefs from transcribed text |
| `/api/routes/voice-search` | POST | Transcribe audio then extract intent |
| `/api/places/autocomplete` | GET | Google Places autocomplete (London-biased) |
| `/health` | GET | Health check |

Full interactive docs at http://localhost:8000/docs when the backend is running.

---

## Makefile Reference

```bash
make help             # Show all commands
make setup            # Copy .env.example files (run once)
make install          # Install all dependencies
make dev              # Start both servers
make dev-backend      # FastAPI only (port 8000)
make dev-frontend     # Next.js only (port 3000)
```
