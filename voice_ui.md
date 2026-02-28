# Voice Input — Current Implementation

## Overview
Voice input is implemented inline in `src/app/page.tsx` using the browser's native Web Speech API. No separate component file. The button is a full-width glassmorphism pill, consistent with the rest of the UI.

---

## Files Changed
- `frontend/src/app/page.tsx` — mic button UI + voice logic + state
- `frontend/src/lib/api.ts` — `fetchVoiceIntent()` function

---

## State
```ts
const [voiceState, setVoiceState] = useState<"idle" | "recording" | "processing">("idle");
const gotResultRef = useRef(false); // prevents onend race condition
```

---

## Button UI (in `page.tsx`, between input card and preferences)
- Full-width rounded pill (`rounded-2xl`)
- Only renders if `window.SpeechRecognition` or `window.webkitSpeechRecognition` is available
- Three visual states:

| State | Appearance | Label |
|-------|-----------|-------|
| `idle` | `bg-white/10 border-white/20 text-white` glassmorphism | 🎙️ Speak your journey |
| `recording` | `bg-red-500/20 border-red-400/50 text-red-300 animate-pulse` | 🎤 Listening… |
| `processing` | `bg-white/10 text-white/60` + spinner | ⏳ Processing… |

---

## Behavior
1. User clicks button → `SpeechRecognition` starts (`lang: en-GB`, `continuous: false`, `interimResults: false`)
2. Browser transcribes speech → `onresult` fires with transcript
3. Transcript sent to `POST /api/routes/voice-intent` via `fetchVoiceIntent()`
4. On success: auto-fills `origin`, `destination`, toggles `preferences` state
5. User still presses **Find Best Route** to trigger the route search

---

## Race Condition Fix
`gotResultRef` tracks whether `onresult` fired. `onend` only resets state to `idle` if no result was received, preventing it from stomping on the `processing` state.

```ts
recognition.onend = () => {
  if (!gotResultRef.current) setVoiceState("idle");
};
```

---

## API Function (`src/lib/api.ts`)
```ts
export async function fetchVoiceIntent(text: string): Promise<VoiceIntentResult | null>
// POST http://localhost:8000/api/routes/voice-intent
// Body: { text: string }
// Returns: { origin, destination, preferences } or null on error
```

---

## What Is NOT Implemented
- Auto-trigger `fetchRankedRoutes` after intent (user presses Search manually)
- Separate `VoiceSearch.tsx` component
- Circular iOS-style button
