import { RouteOption } from "@/types";
import { Footprints, Train, ArrowRight } from "lucide-react";

interface Props {
  route: RouteOption;
  isTopChoice: boolean;
  rank: number;
}

function StepIcon({ mode }: { mode: string }) {
  if (mode === "WALK") return <Footprints size={14} className="text-slate-400" />;
  return <Train size={14} className="text-cyan-500" />;
}

function StepTimeline({ steps }: { steps: RouteOption["steps"] }) {
  return (
    <div className="flex items-center gap-1 flex-wrap mt-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1">
            <StepIcon mode={step.mode} />
            {step.line && (
              <span className="text-xs font-medium text-slate-600">{step.line}</span>
            )}
            {step.mode === "WALK" && (
              <span className="text-xs text-slate-400">{step.duration_min}m</span>
            )}
          </div>
          {i < steps.length - 1 && (
            <ArrowRight size={12} className="text-slate-300 shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

export default function RouteCard({ route, isTopChoice, rank }: Props) {
  const fare = route.fare_gbp !== null
    ? `£${route.fare_gbp.toFixed(2)}`
    : "Price Unavailable";

  const fareColor = route.fare_gbp !== null ? "text-slate-800" : "text-slate-400";

  if (isTopChoice) {
    return (
      <div className="relative rounded-2xl backdrop-blur-md bg-white/70 shadow-xl ring-2 ring-amber-300 p-5 overflow-hidden">
        {/* Gold shimmer accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-white/0 to-yellow-50/30 pointer-events-none rounded-2xl" />

        {/* Why banner */}
        {route.why && (
          <div className="relative flex items-start gap-2 mb-4 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <span className="text-base font-bold text-amber-500 leading-none mt-0.5">✨</span>
            <p className="text-sm font-medium text-slate-600 leading-snug">{route.why}</p>
          </div>
        )}

        {/* Rank badge */}
        <div className="relative flex items-center justify-between mb-1">
          <span className="text-xs font-bold tracking-widest text-amber-500 uppercase">
            🏆 Best Route
          </span>
          <span className="text-xs text-slate-300 font-mono">Score {route.score.toFixed(2)}</span>
        </div>

        {/* Summary */}
        <p className="relative text-sm text-slate-600 mb-3">{route.summary}</p>

        {/* Key stats */}
        <div className="relative flex items-end gap-6">
          <div>
            <span className="text-4xl font-bold text-slate-900 tracking-tight">
              {Math.round(route.duration_min)}
            </span>
            <span className="text-base font-medium text-slate-400 ml-1">min</span>
          </div>
          <div className="flex flex-col pb-1">
            <span className={`text-lg font-semibold ${fareColor}`}>{fare}</span>
            <span className="text-xs text-slate-400">
              {route.walk_min} min walk · {route.transfers} transfer{route.transfers !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Step timeline */}
        <div className="relative">
          <StepTimeline steps={route.steps} />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 shadow-sm p-4">
      {/* Rank */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {rank === 2 ? "🥈" : "🥉"} Option {rank}
        </span>
        <span className="text-xs text-slate-300 font-mono">Score {route.score.toFixed(2)}</span>
      </div>

      {/* Summary */}
      <p className="text-sm text-slate-600 mb-3">{route.summary}</p>

      {/* Stats */}
      <div className="flex items-end gap-5">
        <div>
          <span className="text-3xl font-bold text-slate-900 tracking-tight">
            {Math.round(route.duration_min)}
          </span>
          <span className="text-sm font-medium text-slate-400 ml-1">min</span>
        </div>
        <div className="flex flex-col pb-0.5">
          <span className={`text-base font-semibold ${fareColor}`}>{fare}</span>
          <span className="text-xs text-slate-400">
            {route.walk_min} min walk · {route.transfers} transfer{route.transfers !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <StepTimeline steps={route.steps} />
    </div>
  );
}
