"use client";

import { useState, useRef } from "react";
import { MapPin, Navigation, Loader2, Search, Mic, Square } from "lucide-react";
import { Preferences, RouteOption, TravelMode } from "@/types";
import { fetchRankedRoutes, fetchVoiceSearch } from "@/lib/api";
import PreferenceToggles from "@/components/PreferenceToggles";
import RouteCard from "@/components/RouteCard";
import TravelPass from "@/components/TravelPass";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";
import VideoBackground from "@/components/VideoBackground";
import CycleRouteMap from "@/components/CycleRouteMap";
import BoatRouteMap from "@/components/BoatRouteMap";
import WeatherWidget from "@/components/WeatherWidget";

const DEFAULT_PREFERENCES: Preferences = {
  budget_friendly: false,
  lazy_walk: false,
  easy_transfer: false,
  accessibility: false,
  pet_friendly: false,
  speed_first: false,
  cycle2work: false,
  scenic_bus: false,
  scenic_boat: false,
};

export default function Home() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [passRoute, setPassRoute] = useState<RouteOption | null>(null);
  const [mode, setMode] = useState<TravelMode>("commute");
  const [voiceState, setVoiceState] = useState<"idle" | "recording" | "processing">("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  async function handleVoiceInput() {
    if (voiceState === "recording") {
      mediaRecorderRef.current?.stop();
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      console.error("[voice] mic access denied:", e);
      return;
    }

    const getSupportedMimeType = () => {
      const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) return type;
      }
      return "";
    };
    const mimeType = getSupportedMimeType();
    const options = mimeType ? { mimeType } : {};
    const recorder = new MediaRecorder(stream, options);
    mediaRecorderRef.current = recorder;

    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: mimeType });
      setVoiceState("processing");
      const intent = await fetchVoiceSearch(blob);
      if (intent) {
        if (intent.origin) setOrigin(intent.origin);
        if (intent.destination) setDestination(intent.destination);
        if (intent.preferences) setPreferences({ ...DEFAULT_PREFERENCES, ...intent.preferences });
      }
      setVoiceState("idle");
    };

    setVoiceState("recording");
    recorder.start();
    // Auto-stop after 10s
    setTimeout(() => { if (recorder.state === "recording") recorder.stop(); }, 10000);
  }

  function togglePreference(key: keyof Preferences) {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSearch() {
    if (!origin.trim() || !destination.trim()) {
      setError("Please enter both origin and destination.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const results = await fetchRankedRoutes({
        origin: origin.trim(),
        destination: destination.trim(),
        depart_time_iso: new Date().toISOString(),
        preferences,
      });
      setRoutes(results);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <VideoBackground />

      <main className="relative z-10 max-w-md mx-auto pt-10 pb-16 px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1
            className="text-6xl text-white drop-shadow-lg"
            style={{ fontFamily: "var(--font-dancing)" }}
          >
            Travelet
          </h1>
          <p className="text-sm text-white/70 mt-1 tracking-wide">Go on your vibe</p>
        </div>

        {/* Input Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 p-5 mb-4 space-y-3">
          {/* Origin */}
          <PlaceAutocomplete
            value={origin}
            onChange={setOrigin}
            placeholder="From — e.g. King's Cross, London"
            icon={
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <MapPin size={16} className="text-blue-500" />
              </div>
            }
          />

          <div className="h-px bg-slate-100 ml-11" />

          {/* Destination */}
          <PlaceAutocomplete
            value={destination}
            onChange={setDestination}
            placeholder="To — e.g. Heathrow Airport, London"
            icon={
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                <Navigation size={16} className="text-green-500" />
              </div>
            }
          />
        </div>

        {/* Mode switcher */}
        <div className="flex rounded-2xl bg-white/10 border border-white/20 p-1 mb-4">
          {(["commute", "explore"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setPreferences(DEFAULT_PREFERENCES); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                mode === m ? "bg-white text-slate-800 shadow" : "text-white/70 hover:text-white"
              }`}
            >
              {m === "commute" ? "🚇 Commute" : "🗺️ Explore"}
            </button>
          ))}
        </div>

        {/* Mic button */}
        <button
          onClick={handleVoiceInput}
          disabled={voiceState === "processing"}
          className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold tracking-tight border transition-all duration-200 active:scale-[0.98] mb-4 ${
            voiceState === "recording"
              ? "bg-red-500/20 border-red-400/50 text-red-300 animate-pulse"
              : voiceState === "processing"
              ? "bg-white/10 border-white/20 text-white/60"
              : "bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-sm"
          }`}
        >
          {voiceState === "recording" ? (
            <><Square size={16} fill="currentColor" /> Tap to stop</>
          ) : voiceState === "processing" ? (
            <><Loader2 size={16} className="animate-spin" /> Processing…</>
          ) : (
            <><Mic size={16} /> Speak your journey</>
          )}
        </button>

        {/* Preferences */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 px-1">
            Your preferences
          </p>
          <PreferenceToggles preferences={preferences} onChange={togglePreference} mode={mode} />
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-2xl py-4 text-base font-semibold tracking-tight shadow-lg shadow-cyan-900/40 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 mb-6"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Finding routes…
            </>
          ) : (
            <>
              <Search size={18} />
              Find Best Route
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="mb-4 text-sm text-red-200 text-center bg-red-900/40 backdrop-blur-sm rounded-xl py-3 px-4 border border-red-500/30">
            {error}
          </div>
        )}

        {/* Results */}
        {hasSearched && !isLoading && routes.length === 0 && !error && (
          <p className="text-center text-sm text-white/50">No routes found. Try different locations.</p>
        )}

        {routes.length > 0 && (() => {
          const hasCycle = routes.some((r) => r.steps.some((s) => s.mode === "CYCLE"));
          const hasBoat = routes.some((r) => r.steps.some((s) => s.mode === "FERRY"));
          const displayRoutes = preferences.cycle2work
            ? routes.filter((r) => r.steps.some((s) => s.mode === "CYCLE"))
            : routes;
          return (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider px-1">
                {preferences.cycle2work ? "Cycling route" : `Top ${displayRoutes.length} route${displayRoutes.length !== 1 ? "s" : ""}`}
              </p>
              {hasCycle && <WeatherWidget />}
              {hasCycle && <CycleRouteMap origin={origin} destination={destination} />}
              {hasBoat && <BoatRouteMap origin={origin} destination={destination} />}
              {displayRoutes.map((route, index) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  isTopChoice={index === 0}
                  rank={index + 1}
                  onGetPass={() => setPassRoute(route)}
                />
              ))}
            </div>
          );
        })()}
      </main>
      {passRoute && (
        <TravelPass
          route={passRoute}
          origin={origin}
          destination={destination}
          onClose={() => setPassRoute(null)}
          mode={mode}
        />
      )}
    </>
  );
}
