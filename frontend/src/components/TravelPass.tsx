"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { X, Download, ArrowRightLeft } from "lucide-react";
import { RouteOption, TravelMode } from "@/types";

interface Props {
  route: RouteOption;
  origin: string;
  destination: string;
  onClose: () => void;
  mode: TravelMode;
}

// ── Shared helpers ───────────────────────────────────────────

function BarcodePattern({ fillColor }: { fillColor: string }) {
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
    <svg width={x} height="40" viewBox={`0 0 ${x} 40`}>
      {bars.map((bar, i) => (
        <rect key={i} x={bar.x} y={0} width={bar.width} height={40} fill={fillColor} />
      ))}
    </svg>
  );
}

function fmt(d: Date) {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function mergeWalkSteps(steps: RouteOption["steps"]) {
  return steps.reduce<RouteOption["steps"]>((acc, step) => {
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
}

// ── Explore pass (premium airline boarding pass) ─────────────

function ExploreTicket({ route, origin, destination, mergedSteps, fare, departTime, arrivalTime }: {
  route: RouteOption;
  origin: string;
  destination: string;
  mergedSteps: RouteOption["steps"];
  fare: string;
  departTime: Date;
  arrivalTime: Date;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-2xl select-none">
      {/* Header — cyan */}
      <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-t-3xl px-6 pt-5 pb-6">
        <div className="flex items-center justify-between mb-5">
          <span className="text-white text-[26px] leading-none font-bold" style={{ fontFamily: "var(--font-dancing)" }}>
            Travelet
          </span>
          <span className="text-[10px] text-cyan-100 font-semibold uppercase tracking-[0.18em]">
            London Vibe
          </span>
        </div>
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

      {/* Tear line */}
      <div className="relative flex items-center">
        <div className="absolute -left-3.5 w-7 h-7 rounded-full bg-black/70" />
        <div className="flex-1 border-t-2 border-dashed border-slate-200 mx-4" />
        <div className="absolute -right-3.5 w-7 h-7 rounded-full bg-black/70" />
      </div>

      {/* Steps */}
      <div className="px-6 py-3 divide-y divide-slate-50">
        {mergedSteps.length === 0 ? (
          <p className="text-sm text-slate-400 py-2 italic">No steps available</p>
        ) : (
          mergedSteps.map((step, i) => {
            const EMOJI: Record<string, string> = {
              WALK: "🚶", BUS: "🚌", TRAM: "🚋", RAIL: "🚂", FERRY: "⛵", CYCLE: "🚲",
            };
            const LABEL: Record<string, string> = {
              WALK: "Walk", BUS: "Bus", TRAM: "Tram", RAIL: "Rail", FERRY: "Boat", CYCLE: "Cycle",
            };
            const emoji = EMOJI[step.mode] ?? "🚇";
            const modeLabel = LABEL[step.mode] ?? "Tube";
            const label = step.mode === "WALK"
              ? `Walk ${Math.round(step.duration_min)} min`
              : `${modeLabel}${step.line ? ` · ${step.line}` : ""} → ${step.to_stop} · ${Math.round(step.duration_min)} min`;
            return (
              <div key={i} className="flex items-start gap-3 py-2">
                <span className="text-base leading-none mt-0.5 shrink-0">{emoji}</span>
                <span className="text-sm text-slate-700 leading-snug">{label}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="bg-slate-50 rounded-b-3xl px-6 pt-4 pb-6">
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: "Fare", value: fare },
            { label: "Walk", value: `${route.walk_min}m` },
            { label: "Changes", value: String(route.transfers) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl py-2.5 text-center shadow-sm ring-1 ring-slate-100">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
              <p className="text-base font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <BarcodePattern fillColor="#0f172a" />
          <p className="text-[10px] text-slate-300 font-mono tracking-[0.22em] uppercase">
            {route.id.replace(/-/g, "").slice(0, 20)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Commute pass (UK National Rail orange ticket) ────────────

function CommuteTicket({ route, origin, destination, mergedSteps, fare, departTime }: {
  route: RouteOption;
  origin: string;
  destination: string;
  mergedSteps: RouteOption["steps"];
  fare: string;
  departTime: Date;
}) {
  const dateStr = departTime
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();

  const transitLines = mergedSteps
    .filter((s) => s.mode !== "WALK")
    .map((s) => s.line || s.mode);
  const routeLabel = transitLines.length > 0 ? transitLines.join("+") : "ANY PERMITTED";
  const hasRail = mergedSteps.some((s) => s.mode === "RAIL");

  const MONO: React.CSSProperties = { fontFamily: "'Courier New', Courier, monospace" };

  return (
    <div style={{ backgroundColor: "#FF8C00", ...MONO }} className="rounded-2xl overflow-hidden select-none">

      {/* ── Header band ─────────────────────────────────── */}
      <div style={{ backgroundColor: "#CC6600" }} className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <ArrowRightLeft size={13} className="text-white" strokeWidth={2.5} />
          <span className="text-white text-[10px] font-bold tracking-[0.2em] uppercase">TRAVELET TICKET</span>
        </div>
        <div className="text-right text-[8.5px] text-white/90 font-bold tracking-wider leading-snug uppercase">
          <div>CLASS: STD</div>
          <div>TICKET TYPE: ANYTIME SINGLE</div>
        </div>
      </div>

      {/* ── From / To ──────────────────────────────────── */}
      <div className="px-4 pt-3 pb-2">
        <div className="grid grid-cols-[1fr_20px_1fr] items-start gap-1">
          <div>
            <div className="text-[8px] font-bold tracking-[0.3em] text-amber-900 mb-0.5">FROM</div>
            <div className="text-black text-[13px] font-bold uppercase leading-tight">{origin}</div>
          </div>
          <div className="text-xl font-bold text-amber-900 text-center mt-2.5">→</div>
          <div className="text-right">
            <div className="text-[8px] font-bold tracking-[0.3em] text-amber-900 mb-0.5">TO</div>
            <div className="text-black text-[13px] font-bold uppercase leading-tight">{destination}</div>
          </div>
        </div>
      </div>

      {/* ── Date + Route ───────────────────────────────── */}
      <div className="mx-4 border-t border-dashed border-amber-800/40" />
      <div className="flex items-center justify-between px-4 py-1.5 text-[8.5px] font-bold uppercase tracking-wider text-amber-900">
        <span>DATE: {dateStr}</span>
        <span className="max-w-[130px] truncate text-right">ROUTE: {routeLabel}</span>
      </div>
      <div className="mx-4 border-t border-dashed border-amber-800/40" />

      {/* ── Steps (dot-matrix style) ───────────────────── */}
      <div className="px-4 py-2 space-y-0.5">
        {mergedSteps.map((s, i) => {
          const TAG: Record<string, string> = {
            WALK: "WALK", BUS: "BUS ", TRAM: "TRAM", RAIL: "RAIL",
            FERRY: "BOAT", CYCLE: "BICY", TUBE: "TUBE",
          };
          const tag = TAG[s.mode] ?? "TRNS";
          const lineStr = s.line ? `(${s.line.slice(0, 10)}) ` : "";
          const stop = s.to_stop ? `→ ${s.to_stop.slice(0, 20).toUpperCase()}` : "";
          const dur = `${Math.round(s.duration_min)}M`;
          return (
            <div key={i} className="text-[8.5px] font-bold uppercase tracking-wide text-black leading-snug">
              {`> ${tag} ${lineStr}${stop} [${dur}]`}
            </div>
          );
        })}
      </div>

      {/* ── Price / Validity ──────────────────────────── */}
      <div style={{ backgroundColor: "#CC6600" }} className="flex items-end justify-between px-4 py-2.5 mt-1">
        <div>
          <div className="text-[8px] text-white/80 font-bold tracking-[0.2em] uppercase">ADULT x1</div>
          <div className="text-[8px] text-white/80 font-bold tracking-[0.2em] uppercase mt-0.5">VALIDITY: ON DATE SHOWN</div>
          {hasRail && (
            <div className="text-[7.5px] text-white/60 font-bold tracking-[0.12em] uppercase mt-0.5">+ RAILWAY FARE APPLIES</div>
          )}
        </div>
        <div className="text-right">
          <div className="text-[8px] text-white/80 font-bold tracking-[0.2em] uppercase mb-0.5">PRICE</div>
          <div className="text-2xl font-bold text-white leading-none">{fare}</div>
        </div>
      </div>

      {/* ── Magnetic stripe ────────────────────────────── */}
      <div className="bg-black flex flex-col items-center py-2.5 gap-1.5">
        <BarcodePattern fillColor="white" />
        <div className="text-[7.5px] text-white/40 font-mono tracking-[0.28em] uppercase">
          {route.id.replace(/-/g, "").slice(0, 20).toUpperCase()}
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────

export default function TravelPass({ route, origin, destination, onClose, mode }: Props) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const mergedSteps = mergeWalkSteps(route.steps);
  const fare = route.fare_gbp !== null ? `£${route.fare_gbp.toFixed(2)}` : "£--.--";
  const departTime = new Date();
  const arrivalTime = new Date(departTime.getTime() + route.duration_min * 60000);

  async function handleDownload() {
    if (!ticketRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(ticketRef.current, {
        pixelRatio: 3,
        backgroundColor: mode === "commute" ? "#FF8C00" : "#ffffff",
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
      <button
        onClick={onClose}
        className="absolute top-5 right-5 text-white/60 hover:text-white transition-colors"
        aria-label="Close"
      >
        <X size={22} />
      </button>

      <div className="w-full max-w-sm">
        {/* Ticket — captured as PNG */}
        <div ref={ticketRef}>
          {mode === "commute" ? (
            <CommuteTicket
              route={route}
              origin={origin}
              destination={destination}
              mergedSteps={mergedSteps}
              fare={fare}
              departTime={departTime}
            />
          ) : (
            <ExploreTicket
              route={route}
              origin={origin}
              destination={destination}
              mergedSteps={mergedSteps}
              fare={fare}
              departTime={departTime}
              arrivalTime={arrivalTime}
            />
          )}
        </div>

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
