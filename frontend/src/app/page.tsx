"use client";

import { useState } from "react";
import { MapPin, Navigation, Loader2, Search } from "lucide-react";
import { Preferences, RouteOption } from "@/types";
import { fetchRankedRoutes } from "@/lib/api";
import PreferenceToggles from "@/components/PreferenceToggles";
import RouteCard from "@/components/RouteCard";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";

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
        <h1
          className="text-5xl text-gray-900"
          style={{ fontFamily: "var(--font-dancing)" }}
        >
          Travelet
        </h1>
        <p className="text-sm text-gray-400 mt-1">Commute on your vibe</p>
      </div>

      {/* Input Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-4 space-y-3">
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

        <div className="h-px bg-gray-100 ml-11" />

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
        className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-2xl py-4 text-base font-semibold tracking-tight shadow-lg shadow-cyan-200 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 mb-6"
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
