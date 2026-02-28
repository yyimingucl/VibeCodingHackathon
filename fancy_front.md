# Role: Frontend UI/UX Designer
# Context: Hackathon MVP polish. We want to make the App Name look "Fancy" by using a cursive/calligraphy font, contrasting with the clean UI.

## Task
1. Update the Next.js frontend to use a beautiful script font for the App Name in the header.
2. Update the frontend Header and title to use the app name Travelet and change the slogan to  "Route Ranker, London transit, ranked for you" to "Commute on your vibe" 
### 1. Import Google Font
- Open `src/app/layout.tsx` (or `src/app/page.tsx` if the header is there).
- Import `Dancing_Script` from `next/font/google`.
  ```typescript
  import { Dancing_Script } from 'next/font/google';
  const dancingScript = Dancing_Script({ subsets: ['latin'], weight: ['700'] });