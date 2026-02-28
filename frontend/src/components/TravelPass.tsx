"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { X, Download } from "lucide-react";
import { RouteOption } from "@/types";

interface Props {
  route: RouteOption;
  origin: string;
  destination: string;
  onClose: () => void;
}

function Barcode() {
  // Alternating [bar, gap] widths — looks like a real EAN/Code128 barcode
  const pattern = [
    2, 1, 1, 1, 3, 1, 1, 1, 2, 2, 1, 1, 3, 1, 2, 1, 1, 2, 3, 1,
    1, 1, 2, 1, 1, 1, 3, 2, 1, 1, 2, 1, 3, 1, 1, 1, 2, 1, 1, 2,
    3, 1, 1, 1, 2, 1, 1, 1, 3, 1, 2, 2, 1, 1, 3, 1, 2, 1, 1, 1,
    1, 2, 2, 1, 3, 1, 1, 1, 2, 1, 2, 1, 1, 1, 3, 2, 2, 1, 1, 1,
  ];
  const bars: { x: number; width: number }[] = [];
  let x = 0;
  for (let i = 0; i < pattern.length; i += 2) {
    bars.push({ x, width: pattern[i] });
    x += pattern[i] + pattern[i + 1];
  }
  return (
    <svg width={x} height="44" viewBox={`0 0 ${x} 44`}>
      {bars.map((bar, i) => (
        <rect key={i} x={bar.x} y={0} width={bar.width} height={44} fill="#0f172a" />
      ))}
    </svg>
  );
}

function StepRow({ mode, line, toStop, durationMin }: {
  mode: string;
  line: string;
  toStop: string;
  durationMin: number;
}) {
  let emoji = "🚶";
  let label = `Walk ${Math.round(durationMin)} min`;

  if (mode === "BUS") {
    emoji = "🚌";
    label = `Bus${line ? ` · ${line}` : ""} → ${toStop} · ${Math.round(durationMin)} min`;
  } else if (mode === "TRAM") {
    emoji = "🚋";
    label = `Tram${line ? ` · ${line}` : ""} → ${toStop} · ${Math.round(durationMin)} min`;
  } else if (mode === "RAIL") {
    emoji = "🚂";
    label = `Rail${line ? ` · ${line}` : ""} → ${toStop} · ${Math.round(durationMin)} min`;
  } else if (mode !== "WALK") {
    emoji = "🚇";
    label = `Tube${line ? ` · ${line}` : ""} → ${toStop} · ${Math.round(durationMin)} min`;
  }

  return (
    <div className="flex items-start gap-3 py-2">
      <span className="text-base leading-none mt-0.5 shrink-0">{emoji}</span>
      <span className="text-sm text-slate-700 leading-snug">{label}</span>
    </div>
  );
}

function fmt(d: Date) {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function TravelPass({ route, origin, destination, onClose }: Props) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Merge consecutive WALK steps
  const mergedSteps = route.steps.reduce<RouteOption["steps"]>((acc, step) => {
    const prev = acc[acc.length - 1];
    if (step.mode === "WALK" && prev?.mode === "WALK") {
      acc[acc.length - 1] = {
        ...prev,
        duration_min: Math.round((prev.duration_min + step.duration_min) * 10) / 10,
        to_stop: step.to_stop,
      };
      return acc;
    }
    return [...acc, step];
  }, []);

  const fare = route.fare_gbp !== null ? `£${route.fare_gbp.toFixed(2)}` : "N/A";

  const departTime = new Date();
  const arrivalTime = new Date(departTime.getTime() + route.duration_min * 60000);

  async function handleDownload() {
    if (!ticketRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(ticketRef.current, {
        pixelRatio: 3,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = "travelet-pass.png";
      link.href = dataUrl;
      link.click();
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 text-white/60 hover:text-white transition-colors"
        aria-label="Close"
      >
        <X size={22} />
      </button>

      <div className="w-full max-w-sm">
        {/* ── TICKET (captured as PNG) ─────────────────────── */}
        <div ref={ticketRef} className="bg-white rounded-3xl shadow-2xl select-none">

          {/* Header — cyan */}
          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-t-3xl px-6 pt-5 pb-6">
            {/* Brand row */}
            <div className="flex items-center justify-between mb-5">
              <span
                className="text-white text-[26px] leading-none font-bold"
                style={{ fontFamily: "var(--font-dancing)" }}
              >
                Travelet
              </span>
              <span className="text-[10px] text-cyan-100 font-semibold uppercase tracking-[0.18em]">
                London Underground
              </span>
            </div>

            {/* Route summary */}
            <div className="mb-4">
              <p className="text-[11px] text-cyan-200 font-semibold uppercase tracking-widest mb-1">From</p>
              <p className="text-white text-xl font-bold leading-tight truncate">{origin}</p>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 border-t border-dashed border-cyan-300/60" />
              <span className="text-cyan-200 text-xs">▼</span>
              <div className="flex-1 border-t border-dashed border-cyan-300/60" />
            </div>
            <div className="mb-4">
              <p className="text-[11px] text-cyan-200 font-semibold uppercase tracking-widest mb-1">To</p>
              <p className="text-white text-xl font-bold leading-tight truncate">{destination}</p>
            </div>

            {/* Time row */}
            <div className="flex items-center justify-between bg-cyan-400/30 rounded-xl px-4 py-2.5">
              <div className="text-center">
                <p className="text-[10px] text-cyan-100 uppercase tracking-wider mb-0.5">Depart</p>
                <p className="text-white text-base font-bold tabular-nums">{fmt(departTime)}</p>
              </div>
              <div className="text-cyan-200 text-sm">→</div>
              <div className="text-center">
                <p className="text-[10px] text-cyan-100 uppercase tracking-wider mb-0.5">Arrive</p>
                <p className="text-white text-base font-bold tabular-nums">{fmt(arrivalTime)}</p>
              </div>
              <div className="h-6 w-px bg-cyan-300/40" />
              <div className="text-center">
                <p className="text-[10px] text-cyan-100 uppercase tracking-wider mb-0.5">Duration</p>
                <p className="text-white text-base font-bold tabular-nums">{Math.round(route.duration_min)} min</p>
              </div>
            </div>
          </div>

          {/* ── Tear line ─────────────────────────── */}
          <div className="relative flex items-center">
            {/* Left notch */}
            <div className="absolute -left-3.5 w-7 h-7 rounded-full bg-black/70" />
            <div className="flex-1 border-t-2 border-dashed border-slate-200 mx-4" />
            {/* Right notch */}
            <div className="absolute -right-3.5 w-7 h-7 rounded-full bg-black/70" />
          </div>

          {/* Steps */}
          <div className="px-6 py-3 divide-y divide-slate-50">
            {mergedSteps.length === 0 ? (
              <p className="text-sm text-slate-400 py-2 italic">No steps available</p>
            ) : (
              mergedSteps.map((step, i) => (
                <StepRow
                  key={i}
                  mode={step.mode}
                  line={step.line}
                  toStop={step.to_stop}
                  durationMin={step.duration_min}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 rounded-b-3xl px-6 pt-4 pb-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className="bg-white rounded-xl py-2.5 text-center shadow-sm ring-1 ring-slate-100">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Fare</p>
                <p className="text-base font-bold text-slate-900">{fare}</p>
              </div>
              <div className="bg-white rounded-xl py-2.5 text-center shadow-sm ring-1 ring-slate-100">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Walk</p>
                <p className="text-base font-bold text-slate-900">{route.walk_min}<span className="text-xs font-medium text-slate-400"> m</span></p>
              </div>
              <div className="bg-white rounded-xl py-2.5 text-center shadow-sm ring-1 ring-slate-100">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Changes</p>
                <p className="text-base font-bold text-slate-900">{route.transfers}</p>
              </div>
            </div>

            {/* Barcode */}
            <div className="flex flex-col items-center gap-1.5">
              <Barcode />
              <p className="text-[10px] text-slate-300 font-mono tracking-[0.22em] uppercase">
                {route.id.replace(/-/g, "").slice(0, 20)}
              </p>
            </div>
          </div>
        </div>
        {/* ── END TICKET ─────────────────────────────────────── */}

        {/* Download button — outside ticket, not captured in PNG */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-2xl py-3.5 text-sm font-semibold tracking-tight backdrop-blur-sm border border-white/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
        >
          <Download size={15} />
          {isDownloading ? "Saving…" : "Save as Image"}
        </button>
      </div>
    </div>
  );
}
