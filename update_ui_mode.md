# Role: Backend Algorithm Engineer

# Context: We are upgrading "Travelet" to support two distinct user modes: "Commute" and "Explore". We need to add new preference flags and highly localized London routing logic.

## Task

Update the `preferences` schema and the ranking algorithm in `backend/services/ranking.py` (or wherever your scoring logic lives).

### 1. Update the Contract

Ensure the backend accepts these new boolean flags in the `preferences` dictionary (defaulting to False if missing):

- `speed_first` (Optimize heavily for lowest duration)
- `cycle2work` (Favor routes with active transport / walking)
- `scenic_bus` (The London Tourist Magic - Favor iconic bus routes and surface transport)
  *(Keep the existing ones like `budget_friendly`, `lazy_walk`, `easy_transfer`, `accessibility`, `pet_friendly`).*

### 2. Update the Scoring Logic

Add these new penalties/bonuses to the objective function:

- **Speed First**: If `speed_first` is True, drastically increase the weight penalty for `duration_min`.
- **Cycle to Work**: If `cycle2work` is True, REWARD routes that have a higher percentage of walking time (e.g., `bonus = walk_min * 2`).
- **Scenic Bus (The Magic Trick)**: If `scenic_bus` is True:
  1. Heavily PENALIZE any step that uses "TUBE", "SUBWAY", or "UNDERGROUND" (tourists want to see the city, not dark tunnels).
  2. REWARD steps that use "BUS".
  3. **Killer Feature**: Check the bus line number. If the line is one of London's iconic sightseeing routes (`"11", "15", "24", "9", "RV1"`), give it a MASSIVE score bonus.

### 3. Update the "Why" Explanation Template

Add fun, context-aware explanation strings for the new features.

- E.g., for Scenic Bus: "✨ Ranked #1: Keeps you above ground on iconic London bus routes so you can enjoy the view!"
- E.g., for Cycle2work: "✨ Ranked #1: Includes active segments to help you hit your daily step goal."
