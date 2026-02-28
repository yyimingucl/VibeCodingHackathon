# Role: Full-Stack Engineer & UI/UX Expert

# Context: We are adding a "Vivid Dark Mode Route Map" to Travelet. When users search, we want to visually draw the selected route on a Google Map using Polylines. The map must match our premium dark mode aesthetic.

## Task

Update the backend to expose polyline data, and implement a visually stunning interactive map in the Next.js frontend.

### 1. Update Backend Contract (`backend/models/route.py` & `google_api.py`)

- **Schema**: Add `encoded_polyline: str` to the `RouteOption` schema.
- **Parsing**: In `fetch_google_routes`, extract the `polyline.encodedPolyline` from the route data and pass it to our `RouteOption` object. (Google Routes API provides an encoded polyline for the entire route or per leg).

### 2. Frontend Dependencies

- Run: `npm install @vis.gl/react-google-maps` (Google's official React wrapper) and `@googlemaps/polyline-codec` (to decode the polyline string).
- Ensure `Maps_API_KEY` is available in `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local`.

### 3. Create the Map Component (`src/components/RouteMap.tsx`)

- Use `<APIProvider>`, `<Map>`, and `<AdvancedMarker>` from `@vis.gl/react-google-maps`.
- **Props**: `route: RouteOption | null`
- **Dark Mode Styling**: Apply a custom Map ID or use `styles` prop with a deep dark Google Maps JSON theme (black background, dark gray roads, minimal labels).
- **The Glowing Polyline**:
  - Decode the `route.encoded_polyline` using the codec.
  - Draw a `<Polyline>` (you may need to create a custom component using `useMap` hook since `@vis.gl` requires drawing polylines via the raw Maps API).
  - **Vibe Styling**: Set the stroke color to `#3B82F6` (Electric Blue) or `#06B6D4` (Cyan), `strokeWeight: 6`, and `strokeOpacity: 0.8`.
- **Markers**: Place a custom start marker 📍 and end marker 🏁 using the origin and destination coordinates.
- **Auto-Fit Bounds**: When the route changes, automatically adjust the map bounds (`map.fitBounds`) to perfectly frame the entire route.

### 4. Integrate into Main UI (`src/app/page.tsx`)

- **Layout Shift**: Make the layout a split-view on desktop (Map on the right/top, controls on the left/bottom), or a half-screen sticky map on mobile.
- **State**: `const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);`
- **Interactivity**: When the user clicks on the "Runner-up" cards, update `selectedRouteIndex`. Pass `routes[selectedRouteIndex]` to the `RouteMap` component so the map dynamically redraws the path based on the clicked card!

**Action**: Implement this magical map integration. The transition when a new route is drawn must feel extremely premium and native.
