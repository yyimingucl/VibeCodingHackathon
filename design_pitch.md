# Role: Lead Next.js Frontend Engineer (Design Focus)
# Context: Hackathon MVP. We have finalized our app name (e.g., WayMatch), logo concept (The Vibe Pin), and color palette ("Optimized Vibe") based on the Clean iOS Glassmorphism aesthetic. We are now skinning the entire app.

## Task
Read the contract in `claude.md` first. Then, update the Next.js frontend code (especially `tailwind.config.ts`, `src/app/page.tsx`, and component files) to implement the "Optimized Vibe" visual identity. Do NOT break the existing logic.

### 1. Tailwind Config Update (`tailwind.config.ts`)
Update your theme colors to include the "Optimized Vibe" palette:
- `primary`: `#06B6D4` (Cyan 500)
- `ranking`: `#F59E0B` (Amber 500)
- `toggle-inactive`: `#F1F5F9` (Slate 100)
- `toggle-active`: `#3B82F6` (Blue 500)
- `bg-slate`: `#F8FAFC` (Slate 50)
- `text-slate-main`: `#0F172A` (Slate 900)
- `text-slate-sub`: `#475569` (Slate 600)
- `ring-gold`: `#FCD34D` (Amber 300 - for the rim of Top 1)

Ensure your configuration handles large radii (`rounded-xl`, `rounded-2xl`) and soft shadows (`shadow-sm`, `shadow-md`).

### 2. Header Update (`src/app/page.tsx`)
- Update the page header to use the app name (use a placeholder for now, e.g., "WayMatch" or leave it for the user to select, but prepare the layout). Add the slogan below it.
- **Action Button**: The "Find Best Route" button must use `bg-cyan-500` (Primary Accent) with full white text. Add a polished hover effect (`hover:bg-cyan-600`).

### 3. Preferences Toggles (`src/components/PreferenceToggles.tsx`)
- Update the styling of the 5 pill-shaped toggle buttons side-by-side. 
- Icons: Ensure icons are legible. Active state: `bg-blue-500 text-white shadow-md`. Inactive state: `bg-slate-100 text-slate-500`.

### 4. Route Card Update (`src/components/RouteCard.tsx`)
This is the main display component. Apply the ranking aesthetics.
**Common for All Cards**: Use `bg-slate-50 border border-slate-100 shadow-sm rounded-2xl`. Huge `text-slate-main font-bold` for `duration_min`. Clean formatting for `fare_gbp`. Mini timeline for steps with icons.
**For the Top Choice Card (`isTopChoice={index === 0}`)**:
- **MUST apply Glassmorphism**: Translucent background (`bg-white/70 backdrop-blur-md`), a subtle glowing ring-2 edge (`ring-2 ring-amber-300`).
- **The "Why" explanation**: At the very top of the card, add a distinct glowing banner with a sparkly icon (✨). The banner text should be bold amber/gold (`text-amber-500`). The explanation text within the banner must be `text-slate-sub`.

### 5. UI Review
- Ensure mobile-first layout with high context.
- All interactive elements must have clear focus states. Handle `fare_gbp` null values cleanly.

**Action**: Execute this design patch immediately. Aim for an premium iOS native app vibe.