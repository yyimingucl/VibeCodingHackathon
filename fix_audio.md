# Role: Frontend Developer
# Context: We are getting a `Runtime NotSupportedError: mimeType is not supported` on line 50 of `src/app/page.tsx` when creating `new MediaRecorder(stream, { mimeType })`. This is likely because the browser (e.g., Safari) does not support `audio/webm`.

## Task
Refactor the `MediaRecorder` initialization in `src/app/page.tsx` (or the relevant voice component) to dynamically check for supported MIME types.

### Implementation Logic
Replace the hardcoded `mimeType` logic with a helper function that checks `MediaRecorder.isTypeSupported()`:

```typescript
const getSupportedMimeType = () => {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/aac",
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return ""; // Fallback: let the browser decide its default
};

// Then use it when initializing the recorder:
const mimeType = getSupportedMimeType();
const options = mimeType ? { mimeType } : {};
const recorder = new MediaRecorder(stream, options);