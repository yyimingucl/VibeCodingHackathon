# Role: Full-Stack Engineer
# Context: Hackathon MVP. We have enough time to implement REAL Google Places Autocomplete. 

## Task
Implement a secure Google Places Autocomplete feature. We will proxy the request through our FastAPI backend to protect the API Key, and build a debounced frontend component.

### 1. Backend: FastAPI Proxy (`backend/routers/routes.py` & `backend/services/google_api.py`)
- Create a new endpoint: `GET /api/places/autocomplete`
- Query parameter: `q` (string, the search input).
- **Service Logic**: Use `httpx` to call the Google Places Autocomplete API:
  `https://maps.googleapis.com/maps/api/place/autocomplete/json`
- **Crucial API Parameters**:
  - `input`: the `q` parameter.
  - `key`: Your `Maps_API_KEY` from environment variables.
  - `components`: `country:gb` (Strictly limit results to the UK).
  - `location`: `51.5074,-0.1278` (London coordinates).
  - `radius`: `30000` (Bias results to a 30km radius around London).
- **Response**: Parse the `predictions` array and return a simple list of strings containing the `description` (e.g., `["King's Cross, London, UK", "Kingsbury, London, UK"]`). Handle API errors gracefully by returning an empty list `[]`.

### 2. Frontend: Debounced Autocomplete Component (`src/components/PlaceAutocomplete.tsx`)
- Create a reusable React component for the input fields.
- **Props**: `value: string`, `onChange: (val: string) => void`, `placeholder: string`.
- **Logic**:
  - Implement a `useEffect` with a `setTimeout` (300ms debounce) so we don't spam the backend on every keystroke.
  - If the debounced input has > 2 characters, fetch from `http://localhost:8000/api/places/autocomplete?q={input}`.
  - Maintain `suggestions` (array of strings) and `isOpen` (boolean) state.
- **UI / Styling**:
  - Match the "Clean iOS Glassmorphism" style.
  - The dropdown must be `absolute`, positioned directly below the input, with high `z-index`, rounded corners, and a soft shadow.
  - Include a subtle loading spinner inside the input field while fetching.
  - Close the dropdown when an option is clicked (calling `onChange` with the full address) or when clicking outside.

### 3. Integration (`src/app/page.tsx`)
- Replace the raw `<input>` fields for `origin` and `destination` with this new `PlaceAutocomplete` component.

**Action**: Execute this full-stack feature. Ensure the Next.js frontend UI remains perfectly stable and responsive.