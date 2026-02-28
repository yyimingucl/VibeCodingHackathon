# Role: Next.js Frontend & UI/UX Expert
# Context: Hackathon MVP. We are adding a killer feature: An "Offline Travel Pass" formatted like an airline boarding pass. London Underground has no cell service, so users need a beautiful, screenshot-friendly summary of their route.

## Task
Create a new feature to display and download the chosen route as a Boarding Pass.

### 1. Install Dependencies
Run this in your terminal if needed:
`npm install html-to-image lucide-react`
*(We will use html-to-image to let users save the pass to their camera roll, and lucide-react for icons).*

### 2. Create the Component (`src/components/TravelPass.tsx`)
Create a visually stunning boarding pass component.
**Props**: `route: RouteOption`, `onClose: () => void`.
**Style Requirements (Tailwind)**:
- Must look like a physical ticket: white background, rounded corners, subtle shadow (`shadow-2xl`).
- Use the "ticket cutout" effect (two transparent or background-colored circles on the left and right edges with a dashed border connecting them horizontally).
- **Header Section**: 
  - Show "VibeRoute Pass" (or your app name) and the `depart_time`.
  - Huge typography for Origin to Destination (e.g., "Waterloo" -> "King's Cross").
- **Body Section (Offline Itinerary)**:
  - Map through `route.steps`.
  - For each step, explicitly show the action: e.g., "🚶 Walk 5 min" or "🚇 Tube (Piccadilly Line) to Holborn". Make this text large and high-contrast so it's readable underground.
- **Footer Section**:
  - Show the total `duration_min` and `fare_gbp`.
  - Add a decorative fake barcode or just a visually pleasing footer.

### 3. Add Export Functionality
- Inside `TravelPass.tsx`, use `useRef` to target the ticket `<div>`.
- Add a button at the very bottom (outside the ticket itself): "📸 Save Offline Pass".
- When clicked, use `toPng` from `html-to-image` to capture the `div` and trigger a browser download (e.g., `download="my-route.png"`).

### 4. Integration in `RouteCard.tsx`
- On the Top 1 Route card (or all cards), add a button: "🎟️ Get Offline Pass".
- When clicked, open a full-screen or centered Modal overlaying the page, displaying the `TravelPass` component.

**Action**: Implement this entire flow. Ensure the ticket looks absolutely premium, like an Apple Wallet pass or an airline ticket.