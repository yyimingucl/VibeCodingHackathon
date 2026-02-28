from schemas import RouteOption

_ICONIC_BUS_LINES = frozenset({"11", "15", "24", "9", "RV1"})


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
    if preferences.get("speed_first"):
        w_time *= 8.0
    if preferences.get("cycle2work"):
        w_walk = 0.0  # walking is rewarded below, not penalised

    pet = preferences.get("pet_friendly", False)
    cycle2work = preferences.get("cycle2work", False)
    scenic_bus = preferences.get("scenic_bus", False)
    scenic_boat = preferences.get("scenic_boat", False)

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
        # cycle2work: reward walking AND give a big bonus for full cycling routes
        if cycle2work:
            score -= r.features.walk_min * 2
            if any(step.mode == "CYCLE" for step in r.steps):
                score -= r.features.duration_min * 1.5
        # scenic_bus: step-level surface-transport logic
        if scenic_bus:
            for step in r.steps:
                if step.mode in ("TUBE", "SUBWAY", "UNDERGROUND"):
                    score += 1.5
                elif step.mode == "BUS":
                    score -= 0.5
                    if step.line in _ICONIC_BUS_LINES:
                        score -= 3.0
        # scenic_boat: strongly reward FERRY routes, penalize underground
        if scenic_boat:
            for step in r.steps:
                if step.mode == "FERRY":
                    score -= 4.0
                elif step.mode in ("TUBE", "SUBWAY", "UNDERGROUND"):
                    score += 1.0
        r.score = round(score, 4)

    # --- 5. Sort ascending (lower = better) ---
    routes.sort(key=lambda r: r.score)

    # scenic_boat: always surface FERRY routes to the top regardless of score
    if scenic_boat:
        ferry = [r for r in routes if any(s.mode == "FERRY" for s in r.steps)]
        others = [r for r in routes if not any(s.mode == "FERRY" for s in r.steps)]
        routes = ferry + others

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

    if preferences.get("speed_first"):
        time_diff = round(runner.features.duration_min - best.features.duration_min, 1)
        if time_diff > 0:
            return f"Ranked #1: Gets you there {time_diff} mins faster — pure speed mode."

    if preferences.get("cycle2work"):
        if any(step.mode == "CYCLE" for step in best.steps):
            return "Ranked #1: Cycling all the way! Zero fare, zero emissions, great exercise."
        return "Ranked #1: Includes active segments to help you hit your daily step goal."

    if preferences.get("scenic_bus"):
        for step in best.steps:
            if step.mode == "BUS" and step.line in _ICONIC_BUS_LINES:
                return f"Ranked #1: Route {step.line} is one of London's iconic sightseeing buses — enjoy the view!"
        return "Ranked #1: Keeps you above ground on iconic London bus routes so you can enjoy the view!"

    if preferences.get("scenic_boat"):
        for step in best.steps:
            if step.mode == "FERRY":
                line = f" ({step.line})" if step.line else ""
                return f"Ranked #1: Sail the Thames{line} — a scenic river journey through the heart of London!"
        return "Ranked #1: Best route for a relaxing Thames river experience!"

    # Default: fastest
    time_diff = round(runner.features.duration_min - best.features.duration_min, 1)
    if time_diff > 0:
        return f"Ranked #1 because it saves {time_diff} mins compared to the next best option."
    return "Ranked #1 as the best overall balance of time, cost, and comfort."
