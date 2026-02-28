"use client";

// ─── HOW TO PICK A VIDEO ────────────────────────────────────────────────────
// 1. Go to YouTube and search "London 4K street walk" or "London aerial 4K"
// 2. Open any video → copy the ID from the URL:
//      https://www.youtube.com/watch?v=  ← the part after "v=" is the ID
// 3. Paste it into YOUTUBE_VIDEO_ID below.
// ────────────────────────────────────────────────────────────────────────────
const YOUTUBE_VIDEO_ID = "xxxxxx"; // Replace with any London street video ID

const src =
  `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}` +
  `?autoplay=1&mute=1&loop=1&playlist=${YOUTUBE_VIDEO_ID}` +
  `&controls=0&disablekb=1&fs=0&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3`;

export default function VideoBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* YouTube iframe — scaled up to avoid letterboxing */}
      <iframe
        src={src}
        title="London background"
        allow="autoplay; encrypted-media"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "calc(100vw + 200px)",
          height: "calc(56.25vw + 200px)", /* 16:9 ratio + buffer */
          minWidth: "calc(177.78vh + 200px)",
          minHeight: "calc(100vh + 200px)",
          border: "none",
        }}
      />

      {/* Dark gradient overlay — keeps UI legible */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />

      {/* Subtle blur for glassmorphism depth */}
      <div className="absolute inset-0 backdrop-blur-[1px]" />
    </div>
  );
}
