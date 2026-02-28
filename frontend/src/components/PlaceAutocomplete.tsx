"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  icon: React.ReactNode;
}

export default function PlaceAutocomplete({ value, onChange, placeholder, icon }: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce: fire 300ms after the user stops typing
  useEffect(() => {
    if (value.length <= 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsFetching(true);
      try {
        const res = await fetch(
          `http://localhost:8001/api/places/autocomplete?q=${encodeURIComponent(value)}`
        );
        if (!res.ok) throw new Error();
        const data: string[] = await res.json();
        setSuggestions(data);
        setIsOpen(data.length > 0);
      } catch {
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setIsFetching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(suggestion: string) {
    onChange(suggestion);
    setIsOpen(false);
    setSuggestions([]);
  }

  return (
    <div ref={containerRef} className="relative flex items-center gap-3 flex-1">
      {/* Leading icon */}
      <div className="shrink-0">{icon}</div>

      {/* Input */}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        className="flex-1 text-sm text-gray-800 placeholder-gray-300 bg-transparent outline-none"
        autoComplete="off"
      />

      {/* Inline loading spinner */}
      {isFetching && (
        <Loader2 size={14} className="animate-spin text-gray-300 shrink-0" />
      )}

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onMouseDown={() => handleSelect(s)}
              className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
