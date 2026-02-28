# Role: Lead Next.js 15 & Tailwind v4 Engineer
# Context: Hackathon MVP. Time is running out (it's afternoon!). We need to scaffold the entire `/src` directory for the Next.js App Router immediately.
# Design Language: Clean iOS, Glassmorphism, highly polished.

## Task
Read the contract in `claude.md` first. Then, create the following files inside the `/src` directory to build a working, beautiful, and crash-proof frontend.

### 1. Types: `src/types/index.ts`
- Create exactly the interfaces defined in `claude.md`.
- `RouteRequest` (with origin, dest, depart_time_iso, and preferences).
- `RouteOption` (ensure `fare_gbp` is `number | null`, and steps use `from_stop`, `to_stop`).

### 2. API Client with Hackathon Fallback: `src/lib/api.ts`
- Write an async function `fetchRankedRoutes(payload: RouteRequest)`.
- It should POST to `http://localhost:8000/api/routes/rank`.
- **CRITICAL**: Use a `try/catch` block. If the fetch fails (CORS, 500, or network error), do NOT throw an error. Instead, `console.error` and return a hardcoded array of 3 realistic London `RouteOption` mocks:
  1. Top Route: "Tube + Walk" (Fastest, £2.80, with a compelling `why` string).
  2. Runner-up: "Bus Only" (Cheapest, £1.75, slower).
  3. Third: "Walk + Tube + Walk" (Medium).
- This guarantees our demo NEVER shows a blank screen to the judges.

### 3. Components: `src/components/PreferenceToggles.tsx`
- Build the "Tick or Not" UI.
- Props: `preferences` (object), `onChange` (function).
- Render 5 pill-shaped toggle buttons side-by-side (scrollable horizontally on mobile).
- Keys: `budget_friendly`, `lazy_walk`, `easy_transfer`, `accessibility`, `pet_friendly`.
- Use `lucide-react` icons. Active state: `bg-blue-500 text-white shadow-md`. Inactive state: `bg-gray-100 text-gray-500`.

### 4. Components: `src/components/RouteCard.tsx`
- Props: `route: RouteOption`, `isTopChoice: boolean`.
- **If `isTopChoice` is true**: Apply Glassmorphism (`bg-white/70 backdrop-blur-md`), a subtle amber/gold gradient border (`ring-2 ring-amber-300`), and a larger shadow (`shadow-xl`). At the top of the card, display a glowing banner with the `why` string (e.g., "✨ Ranked #1: [why text]").
- **If false**: Use a standard clean white card (`bg-white border border-gray-100 shadow-sm`).
- **Body content**:
  - Huge typography for `duration_min` (e.g., "24 min").
  - Display `fare_gbp` as "£X.XX", or "Price Unavailable" in gray if null.
  - Render a mini flex-row timeline of `steps.mode` using icons (Walk -> Transit -> Walk).

### 5. Main Page: `src/app/page.tsx`
- Wrap everything together in a beautiful, mobile-friendly container (`max-w-md mx-auto pt-8 px-4`).
- Manage React state: `origin`, `destination`, `preferences`, `routes` (array), `isLoading`, `error`.
- Create a large, prominent "Find Best Route" button (`w-full bg-black text-white rounded-xl py-4`).
- Below the button, map over the `routes` state and render `RouteCard` components. Pass `isTopChoice={index === 0}` to the first card.