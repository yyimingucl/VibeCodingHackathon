# Role: Expert Next.js 15 & Tailwind CSS v4 Developer
# Context: Hackathon MVP. Build the frontend UI based EXACTLY on the contract in `claude.md`.

## Task
Create a responsive, highly polished Next.js application (App Router) for "Route Ranker".
**Visual Style**: Clean iOS Glassmorphism. Premium, modern, highly legible.

## 1. Type Definitions (`src/types/index.ts`)
Create strict TypeScript interfaces based on `claude.md`.
- `Preferences`: 5 booleans (`budget_friendly`, `lazy_walk`, `easy_transfer`, `accessibility`, `pet_friendly`).
- `RouteRequest`: `origin`, `destination`, `depart_time_iso`, `preferences`.
- `RouteOption`: Matches the backend response exactly (remember to use `from_stop` and `to_stop` in `steps`, and handle `fare_gbp` as `number | null`).

## 2. UI Architecture & Components
Use `lucide-react` for all icons.

### A. The Input Section (Top)
- Clean, minimalist text inputs for `Origin` and `Destination`. 
- Input style: subtle gray border, large rounded corners (`rounded-2xl`), focus states with ring.
- Default `depart_time_iso` to current local time.

### B. "Tick or Not" Preferences (Middle - The Core UX)
- Render 5 stylish toggle buttons (pill-shaped). DO NOT use sliders.
- **Icons needed**: 💰 (Budget), 🦥/🚶 (Walk), 🚇/🔄 (Transfer), ♿ (Accessibility), 🐾 (Pet).
- **Inactive State**: Light gray background (`bg-gray-100`), muted gray text/icon.
- **Active State**: Cyan/Blue background (e.g., `bg-cyan-500` or `bg-blue-500`), white text/icon, slight shadow.
- Toggling updates the `preferences` boolean dictionary in React state.

### C. Action Button
- A prominent, full-width "Find Best Route" button.
- Must include a loading spinner state when `isFetching` is true.

### D. The Results View (Bottom - Route Cards)
Map through the `List[RouteOption]` returned by the backend.

**🏆 Top 1 Card (Index 0)**:
- **Style**: Needs a "Fancy" Glassmorphism effect. Use `backdrop-blur-md bg-white/80` (or similar), soft drop shadow (`shadow-xl`), and a gentle gold/amber gradient border (`ring-2 ring-amber-300`).
- **The "Why"**: Prominently display the `why` string at the top of the card with an accent color or a sparkly icon (✨). This is the key selling point of our demo!

**🥈 Runner-up Cards (Index 1 & 2)**:
- **Style**: Clean, standard cards (`bg-white`, `rounded-xl`, `border border-gray-1