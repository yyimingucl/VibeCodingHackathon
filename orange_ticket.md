# Role: Next.js Frontend & UI Expert
# Context: Hackathon MVP. We are adding a massive "delight" feature. When the user is in 'commute' mode, the generated Offline Travel Pass should look EXACTLY like a classic UK National Rail orange train ticket (great for expense claims). When in 'explore' mode, keep the current sleek airline boarding pass style.

## Task
Refactor the `src/components/TravelPass.tsx` component to conditionally render two completely different UI styles based on the user's `mode`.

### 1. Update Props
- Ensure `TravelPass` receives the `mode` prop (`'commute' | 'explore'`) from its parent (`RouteCard` -> `page.tsx`).

### 2. Style A: The "Explore" Mode (Keep existing)
- If `mode === 'explore'`, render the existing premium, dark-mode airline boarding pass style.

### 3. Style B: The "Commute" Mode (UK National Rail Ticket)
- If `mode === 'commute'`, render the new Orange Ticket style:
  - **Background**: Classic ticket orange (`bg-orange-400` or `#FF9900`), with maybe a lighter pale orange (`bg-orange-200`) section in the middle.
  - **Typography**: MUST use uppercase monospaced font (`font-mono text-black uppercase font-bold`) to simulate dot-matrix printers.
  - **Layout**: A rigid grid system (simulating printed physical boxes).
  - **Ticket Details (Hardcoded aesthetic headers)**:
    - Top left: `CLASS: STD`
    - Top right: `TICKET TYPE: ANYTIME SINGLE`
    - Middle: `FROM: [Origin]` and `TO: [Destination]`
    - Bottom left: `VALIDITY: ON DATE SHOWN`
    - Bottom right: The massive fare `PRICE: [fare_gbp]` (If null, display `PRICE: £--.--`).
  - **The Route Steps**: List the actual transit steps in a small monospaced block at the bottom or middle, mimicking the "Route: ANY PERMITTED" text on real tickets.
  - **Visual Flair**: Add a barcode or a repeating `<ArrowRightLeft />` icon (from lucide-react) to simulate the National Rail logo.

### 4. Integration
- Update `RouteCard.tsx` to pass the `mode` down to `TravelPass`. Ensure the export-to-image feature (`html-to-image`) still works perfectly for both styles.

**Action**: Execute this styling update. Make the orange ticket look incredibly nostalgic and realistic.