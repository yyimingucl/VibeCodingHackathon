# 🤖 System Context & Master Contract
**Project**: Route Ranker MVP (Hackathon 1-Day Challenge)
**Stack**: Next.js 15 (App Router, Tailwind v4) + Python FastAPI

## 🚨 Global Directives for Claude
1. **Contract-Driven**: ALWAYS adhere strictly to the Data Dictionary below. Do NOT add, rename, or remove fields without explicit human approval.
2. **No Pareto**: We have explicitly DROPPED the Pareto frontier feature. Do NOT generate any logic, UI, or types related to "Pareto" or "non-dominated sorting".
3. **Resilience First**: The demo must NEVER crash. Always implement fallback mock data for Google Transit API failures or missing API keys.
4. **Vibe Coding Focus**: Do not over-engineer. Write clean, readable code. Focus on the core MVP: Input -> Fetch -> Rank -> Display Top 3 with Explanation.

---

## 📚 Unified Data Dictionary (The Contract)

This section defines the strict single source of truth for both Frontend (TypeScript) and Backend (Pydantic). 

### 1. User Preferences (Boolean Toggles)
Sliders and weights are removed. We use strict boolean toggles. Default is ALWAYS `false`.
```json
{
  "budget_friendly": false, // Prioritize lowest fare
  "lazy_walk": false,       // Penalize walking time
  "easy_transfer": false,   // Penalize number of transfers
  "accessibility": false,   // Strongly penalize stairs/walking/transfers
  "pet_friendly": false     // Penalize deep underground/tube routes
}


2. Request Payload (POST /api/routes/rank)
Sent from Next.js to FastAPI.

JSON

{
  "origin": "string",
  "destination": "string",
  "depart_time_iso": "string (ISO 8601 format)",
  "preferences": { /* See User Preferences above */ },
  "constraints": { // Optional
    "max_walk_min": 0.0,
    "max_fare_gbp": 0.0,
    "max_transfers": 0
  }
}
3. Response Model (RouteOption)
Returned as a List[RouteOption] from FastAPI to Next.js.
Note for Backend: Handle Python reserved keyword from carefully (e.g., use Pydantic Field(alias="from") or rename to start_stop if necessary, but JSON output must match exactly).

JSON

{
  "id": "string (UUID or hash)",
  "summary": "string (e.g., 'Walk + Tube + Walk')",
  "duration_min": 0.0, // float
  "fare_gbp": 0.0,     // float or null (Frontend must handle null gracefully)
  "walk_min": 0.0,     // float
  "transfers": 0,      // integer
  "steps": [
    {
      "mode": "string (e.g., 'WALK', 'TRANSIT')",
      "line": "string (e.g., 'Piccadilly', empty if WALK)",
      "from_stop": "string", 
      "to_stop": "string",
      "duration_min": 0.0
    }
  ],
  "features": {
    "duration_min": 0.0,
    "fare_gbp": 0.0, // Imputed value if original is null
    "walk_min": 0.0,
    "transfers": 0
  },
  "score": 0.0, // float (Internal ranking score, lower is better. Used for sorting)
  "why": "string" // Explanation for Top 1. Null for others.
}
🛣️ API Endpoints Summary
Backend (FastAPI) Routes
POST /api/routes/raw: Fetches raw Google Transit data, cleans it into List[RouteOption] (score=0, why=null). Returns Mock data if API fails.

POST /api/routes/rank:

Calls /raw.

Applies step-function penalties based on preferences.

Sorts by score ascending.

Generates why explanation for index 0.

Returns sorted List[RouteOption].

Frontend Requirements
Map the JSON response exactly to TS Interfaces.

Top 1 Card: Must prominently display the why explanation.

Null Fare: Display "Price Unavailable" or a placeholder instead of breaking.