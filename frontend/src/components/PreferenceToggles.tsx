"use client";

import { Preferences } from "@/types";
import { PoundSterling, Footprints, ArrowLeftRight, Accessibility, PawPrint } from "lucide-react";

interface ToggleConfig {
  key: keyof Preferences;
  label: string;
  icon: React.ReactNode;
}

const TOGGLES: ToggleConfig[] = [
  { key: "budget_friendly", label: "Budget", icon: <PoundSterling size={16} /> },
  { key: "lazy_walk", label: "Less Walk", icon: <Footprints size={16} /> },
  { key: "easy_transfer", label: "Easy Transfer", icon: <ArrowLeftRight size={16} /> },
  { key: "accessibility", label: "Accessible", icon: <Accessibility size={16} /> },
  { key: "pet_friendly", label: "Pet Friendly", icon: <PawPrint size={16} /> },
];

interface Props {
  preferences: Preferences;
  onChange: (key: keyof Preferences) => void;
}

export default function PreferenceToggles({ preferences, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {TOGGLES.map(({ key, label, icon }) => {
        const active = preferences[key];
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`
              flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium
              whitespace-nowrap transition-all duration-200 select-none
              ${active
                ? "bg-blue-500 text-white shadow-md shadow-blue-200"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }
            `}
          >
            {icon}
            {label}
          </button>
        );
      })}
    </div>
  );
}
