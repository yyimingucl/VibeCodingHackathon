"use client";

import { Preferences } from "@/types";
import { PoundSterling, Footprints, ArrowLeftRight, Accessibility, PawPrint } from "lucide-react";

interface ToggleConfig {
  key: keyof Preferences;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const TOGGLES: ToggleConfig[] = [
  { key: "budget_friendly",  label: "Budget",        description: "Cheapest fare",       icon: <PoundSterling size={18} /> },
  { key: "lazy_walk",        label: "Less Walking",  description: "Minimal on foot",      icon: <Footprints size={18} /> },
  { key: "easy_transfer",    label: "Easy Transfer", description: "Fewer connections",    icon: <ArrowLeftRight size={18} /> },
  { key: "accessibility",    label: "Accessible",    description: "Step-free routes",     icon: <Accessibility size={18} /> },
  { key: "pet_friendly",     label: "Pet Friendly",  description: "Avoid deep Tube",      icon: <PawPrint size={18} /> },
];

interface Props {
  preferences: Preferences;
  onChange: (key: keyof Preferences) => void;
}

export default function PreferenceToggles({ preferences, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {TOGGLES.map(({ key, label, description, icon }, i) => {
        const active = preferences[key];
        const isLastOdd = i === TOGGLES.length - 1 && TOGGLES.length % 2 !== 0;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-2xl text-left
              transition-all duration-200 select-none
              ${isLastOdd ? "col-span-2" : ""}
              ${active
                ? "bg-blue-500 text-white shadow-md shadow-blue-200"
                : "bg-white border border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
              }
            `}
          >
            <span className={`shrink-0 ${active ? "text-white" : "text-slate-400"}`}>
              {icon}
            </span>
            <span className="flex flex-col min-w-0">
              <span className="text-sm font-semibold leading-tight">{label}</span>
              <span className={`text-xs leading-tight mt-0.5 ${active ? "text-blue-100" : "text-slate-400"}`}>
                {description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
