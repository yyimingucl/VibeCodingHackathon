from schemas import RouteOption


def _normalize(values: list[float]) -> list[float]:
    """Min-max normalize; 0.0 = best, 1.0 = worst. Returns 0.0 for all if max==min."""
    lo, hi = min(values), max(values)
    if hi == lo:
        return [0.0] * len(values)
    return [(v - lo) / (hi - lo) for v in values]


def rank_routes(
    routes: list[RouteOption],
    preferences: dict,
    constraints: dict | None,
) -> list[RouteOption]:
    if not routes:
        return routes

    # --- 1. Impute missing fares ---
    for r in routes:
        if r.fare_gbp is None:
            imputed = round(r.duration_min * 0.15 * 1.2, 2)
            r.fare_gbp = imputed
            r.features.fare_gbp = imputed
        else:
            r.features.fare_gbp = r.fare_gbp

    # --- 2. Normalize across all routes ---
    durations = [r.features.duration_min for r in routes]
    fares = [r.features.fare_gbp for r in routes]
    walks = [r.features.walk_min for r in routes]
    transfers = [float(r.features.transfers) for r in routes]

    norm_time = _normalize(durations)
    norm_money = _normalize(fares)
    norm_walk = _normalize(walks)
    norm_transfers = _normalize(transfers)

    # --- 3. Build weights from preferences ---
    w_time = 1.0
    w_money = 0.5
    w_walk = 0.5
    w_transfers = 0.5

    if preferences.get("budget_friendly"):
        w_money *= 10.0
    if preferences.get("lazy_walk"):
        w_walk *= 10.0
    if preferences.get("easy_transfer"):
        w_transfers *= 10.0
    if preferences.get("accessibility"):
        w_walk *= 5.0
        w_transfers *= 5.0

    pet = preferences.get("pet_friendly", False)

    # --- 4. Score each route ---
    for i, r in enumerate(routes):
        score = (
            w_time * norm_time[i]
            + w_money * norm_money[i]
            + w_walk * norm_walk[i]
            + w_transfers * norm_transfers[i]
        )
        if pet and ("Tube" in r.summary or "Underground" in r.summary):
            score += 0.5
        r.score = round(score, 4)

    # --- 5. Sort ascending (lower = better) ---
    routes.sort(key=lambda r: r.score)

    # --- 6. Generate why for top route ---
    if len(routes) >= 2:
        best = routes[0]
        runner = routes[1]
        why = _generate_why(best, runner, preferences)
        routes[0].why = why
    elif routes:
        routes[0].why = "Ranked #1 as the only available option."

    return routes


def _generate_why(best: RouteOption, runner: RouteOption, preferences: dict) -> str:
    if preferences.get("budget_friendly"):
        fare_diff = round((runner.features.fare_gbp - best.features.fare_gbp), 2)
        if fare_diff > 0:
            return f"Ranked #1 because it saves £{fare_diff:.2f}, perfectly matching your budget preference."

    if preferences.get("lazy_walk"):
        walk_diff = round(runner.features.walk_min - best.features.walk_min, 1)
        if walk_diff > 0:
            return f"Ranked #1 to save you {walk_diff} mins of walking."

    if preferences.get("easy_transfer"):
        t_diff = runner.features.transfers - best.features.transfers
        if t_diff > 0:
            return f"Ranked #1 because it has {t_diff} fewer transfer(s), making your journey simpler."

    if preferences.get("accessibility"):
        walk_diff = round(runner.features.walk_min - best.features.walk_min, 1)
        if walk_diff > 0:
            return f"Ranked #1 for accessibility — {walk_diff} mins less walking and fewer transfers."

    if preferences.get("pet_friendly"):
        if "Tube" not in best.summary and "Underground" not in best.summary:
            return "Ranked #1 because it avoids deep underground routes, keeping your pet comfortable."

    # Default: fastest
    time_diff = round(runner.features.duration_min - best.features.duration_min, 1)
    if time_diff > 0:
        return f"Ranked #1 because it saves {time_diff} mins compared to the next best option."
    return "Ranked #1 as the best overall balance of time, cost, and comfort."
