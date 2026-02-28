# Role: Backend Engineer
# Context: Hackathon MVP. We need a way to update our static fare dictionary periodically (e.g., monthly) without hardcoding it in Python files and without setting up a heavy database.

## Task
Refactor the local static fare system to be dynamically updatable via a JSON file and an admin endpoint.

### 1. Migrate to JSON-based Local DB
- Create a new directory `backend/data/` and add a file `fares.json`.
- Move the `FIXED_FARES` dictionary from `backend/core/fares_db.py` into this `fares.json` file.
- Update `backend/core/fares_db.py` to dynamically read from `fares.json` every time `calculate_accurate_fare` is called (or load it into memory and update it when the file changes). Use Python's built-in `json` module.

### 2. Create the Updater Endpoint
- Open `backend/routers/routes.py` (or create an admin router).
- Create a new endpoint: `POST /api/admin/fares/sync`
- **Logic**: 
  1. In a real-world scenario, this would call the TfL or Trainline API. For our MVP, simulate a "monthly update" by reading `fares.json`, increasing the price of the "Heathrow Express" by £0.50 (or applying a random 1-2% inflation to all fares to prove it works), and saving it back to `fares.json`.
  2. Return a success message with the new fares.
  3. *(Optional Security)*: Add a simple hardcoded API key check in the header (e.g., `X-Admin-Key: hackathon2026`) so not everyone can trigger it.

### 3. Documentation for the "Monthly" aspect
- Add a comment block in the code explaining that in production, this endpoint `POST /api/admin/fares/sync` will be triggered by a Monthly Cron Job (e.g., GitHub Actions `schedule` or AWS EventBridge).

**Action**: Implement this lightweight update mechanism safely. Do not break the existing route ranking flow.