"use client";

import { useState } from "react";
import { MapPin, Navigation, Loader2, Search } from "lucide-react";
import { Preferences, RouteOption } from "@/types";
import { fetchRankedRoutes } from "@/lib/api";
import PreferenceToggles from "@/components/PreferenceToggles";
import RouteCard from "@/components/RouteCard";

const DEFAULT_PREFERENCES: Preferences = {
  budget_friendly: false,
  lazy_walk: false,
  easy_transfer: false,
  accessibility: false,
  pet_friendly: false,
};

export default function Home() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

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
    <main className="max-w-md mx-auto pt-10 pb-16 px-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Route Ranker</h1>
        <p className="text-sm text-gray-400 mt-1">London transit, ranked for you</p>
      </div>

      {/* Input Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-4 space-y-3">
        {/* Origin */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <MapPin size={16} className="text-blue-500" />
          </div>
          <input
            type="text"
            placeholder="From — e.g. King's Cross, London"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 text-sm text-gray-800 placeholder-gray-300 bg-transparent outline-none"
          />
        </div>

        <div className="h-px bg-gray-100 ml-11" />

        {/* Destination */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <Navigation size={16} className="text-green-500" />
          </div>
          <input
            type="text"
            placeholder="To — e.g. Heathrow Airport, London"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 text-sm text-gray-800 placeholder-gray-300 bg-transparent outline-none"
          />
        </div>
      </div>

      {/* Preferences */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
          Your preferences
        </p>
        <PreferenceToggles preferences={preferences} onChange={togglePreference} />
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white rounded-2xl py-4 text-base font-semibold tracking-tight shadow-lg shadow-gray-200 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 mb-6"
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
        <div className="mb-4 text-sm text-red-500 text-center bg-red-50 rounded-xl py-3 px-4">
          {error}
        </div>
      )}

      {/* Results */}
      {hasSearched && !isLoading && routes.length === 0 && !error && (
        <p className="text-center text-sm text-gray-400">No routes found. Try different locations.</p>
      )}

      {routes.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
            Top {routes.length} route{routes.length !== 1 ? "s" : ""}
          </p>
          {routes.map((route, index) => (
            <RouteCard
              key={route.id}
              route={route}
              isTopChoice={index === 0}
              rank={index + 1}
            />
          ))}
        </div>
      )}
    </main>
  );
}
