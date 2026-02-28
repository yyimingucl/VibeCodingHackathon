"use client";

import { useEffect, useState } from "react";

interface WeatherData {
  desc: string;
  tempC: string;
  isRainy: boolean;
  rainChance30: number;
}

function getRainChanceIn30(hourly: Array<{ time: string; chanceofrain: string }>): number {
  if (!hourly.length) return 0;
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  // wttr.in hourly blocks are every 3 hours: 0, 300, 600 ... 2100
  const blockIndex = Math.floor(currentHour / 3);
  const minutesUntilNextBlock = (3 - (currentHour % 3)) * 60 - currentMinutes;

  // If next block starts within 30 min, use next block's chance
  const targetBlock = minutesUntilNextBlock <= 30
    ? (hourly[blockIndex + 1] ?? hourly[blockIndex])
    : hourly[blockIndex];

  return parseInt(targetBlock?.chanceofrain ?? "0", 10);
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    fetch("https://wttr.in/London?format=j1")
      .then((r) => r.json())
      .then((data) => {
        const cond = data?.current_condition?.[0];
        if (!cond) return;
        const desc: string = cond.weatherDesc?.[0]?.value ?? "";
        const tempC: string = cond.temp_C ?? "";
        const rainyKeywords = ["rain", "drizzle", "shower", "thunder", "sleet", "snow"];
        const isRainy = rainyKeywords.some((k) => desc.toLowerCase().includes(k));
        const hourly: Array<{ time: string; chanceofrain: string }> =
          data?.weather?.[0]?.hourly ?? [];
        const rainChance30 = getRainChanceIn30(hourly);
        setWeather({ desc, tempC, isRainy, rainChance30 });
      })
      .catch(() => {/* silently ignore */});
  }, []);

  if (!weather) return null;

  const showRainWarning = weather.rainChance30 >= 30;

  return (
    <div className="flex flex-col gap-1.5">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border ${
        weather.isRainy
          ? "bg-slate-800/60 border-slate-600/40 text-slate-300"
          : "bg-amber-900/40 border-amber-500/30 text-amber-200"
      }`}>
        <span className="text-base">{weather.isRainy ? "🌧️" : "☀️"}</span>
        <span>London {weather.tempC}°C · {weather.desc}</span>
      </div>
      {showRainWarning ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border bg-blue-950/60 border-blue-400/30 text-blue-200">
          <span className="text-base">🌦️</span>
          <span>{weather.rainChance30}% chance of rain in the next 30 min — pack a jacket!</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border bg-green-950/50 border-green-500/30 text-green-300">
          <span className="text-base">✅</span>
          <span>No rain expected in the next 30 min — great day to cycle!</span>
        </div>
      )}
    </div>
  );
}
