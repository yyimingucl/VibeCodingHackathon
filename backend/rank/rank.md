# Role: Algorithm Engineer
# Context: Hackathon project (1-day limit). Build the route ranking logic based on strict boolean preferences.

## Task
Create `backend/core/ranking.py` with the main function: 
`def rank_routes(routes: List[RouteOption], preferences: dict, constraints: dict) -> List[RouteOption]`

**Important Note**: We have completely REMOVED all Pareto frontier logic. Do not calculate or return any Pareto tags. Real-world transit always has trade-offs.

## 1. Normalization & Missing Data (Pre-processing)
- Extract the 4 core dimensions from each route: `duration_min`, `fare_gbp`, `walk_min`, `transfers`.
- **Missing Fare Handling**: If a route has `fare_gbp is None` (very common in Google Transit API), impute it using this formula to penalize missing data slightly: `fare_gbp = duration_min * 0.15 * 1.2` (assumes ~15p per minute + 20% penalty). Update the route's `fare_gbp` and `features["fare_gbp"]`.
- **Min-Max Normalization**: For each dimension across all candidates, normalize values to a `0.0` to `1.0` scale. 
  - Formula: `(value - min) / (max - min)`
  - Note: `0.0` is the BEST (lowest time/cost/walk), `1.0` is the WORST. 
  - If `max == min` for a dimension, all normalized values for that dimension should be `0.0`.

## 2. The "Tick or Not" Scoring Logic (Step-function Penalties)
Calculate a final `score` for each route. **Lower score is better.**

**Base weights (Baseline: Fastest reasonable route)**:
`w_time = 1.0`, `w_money = 0.5`, `w_walk = 0.5`, `w_transfers = 0.5`

**Apply Multipliers based on `preferences` (Boolean dictionary)**:
If a user ticked a preference (`True`), we heavily penalize routes that perform poorly on that metric by multiplying its weight.
- If `budget_friendly == True` -> `w_money *= 10.0`
- If `lazy_walk == True` -> `w_walk *= 10.0`
- If `easy_transfer == True` -> `w_transfers *= 10.0`
- If `accessibility == True` -> `w_walk *= 5.0` AND `w_transfers *= 5.0` (Heavily penalize walking and transfers)
- If `pet_friendly == True` -> Add a flat penalty of `+0.5` to the final `score` if the route's `summary` contains "Tube" or "Underground" (as deep escalators/crowds are hard for pets).

**Score Formula**:
`score = (w_time * norm_time) + (w_money * norm_money) + (w_walk * norm_walk) + (w_transfers * norm_transfers)`
Assign this score to `route.score`.

## 3. Explainability (`why` string)
Sort the `routes` list in ascending order based on `score` (index 0 is the best).
For the Route at index 0 (Top 1), generate a human-readable `why` string comparing it to the Route at index 1 (the runner-up).

**Logic for `why`**:
- Check if any preference is `True`. If `budget_friendly` is True and Route 0 is cheaper than Route 1: "Ranked #1 because it saves £{fare_diff}, perfectly matching your budget preference."
- If `lazy_walk` is True and Route 0 has less walk: "Ranked #1 to save you {walk_diff} mins of walking."
- Default fallback (if no preferences matched or ticked): "Ranked #1 because it saves {time_diff} mins compared to the next best option." (Or mention whatever dimension it strictly wins on).

Return the sorted list of `RouteOption` objects.