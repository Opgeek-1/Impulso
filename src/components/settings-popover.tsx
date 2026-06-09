"use client";

import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ACCENTS = [
  { key: "tomo", hex: "#FE3C9C", label: "Pink" },
  { key: "sky", hex: "#0ea5e9", label: "Sky" },
  { key: "indigo", hex: "#6366f1", label: "Indigo" },
  { key: "violet", hex: "#a855f7", label: "Violet" },
];

const DENSITIES = [
  { key: "compact", label: "Compact" },
  { key: "regular", label: "Regular" },
  { key: "comfy", label: "Comfy" },
];

function getStoredPreference(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(key) || fallback;
}

export function SettingsPopover() {
  const [accent, setAccent] = useState(() => getStoredPreference("impulso-accent", "tomo"));
  const [density, setDensity] = useState(() => getStoredPreference("impulso-density", "regular"));

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent);
    localStorage.setItem("impulso-accent", accent);
  }, [accent]);

  useEffect(() => {
    document.documentElement.setAttribute("data-density", density);
    localStorage.setItem("impulso-density", density);
  }, [density]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="imp-icon-btn w-8 h-8 flex items-center justify-center"
        style={{ color: "var(--imp-muted)" }}
        title="Settings"
      >
        <Settings size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-3">
        {/* Accent */}
        <div className="mb-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--imp-faint)" }}>
            Accent color
          </div>
          <div className="flex gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a.key}
                onClick={() => setAccent(a.key)}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-transform"
                style={{
                  background: a.hex,
                  transform: accent === a.key ? "scale(1.15)" : "scale(1)",
                  boxShadow: accent === a.key ? `0 0 0 2px var(--imp-bg), 0 0 0 4px ${a.hex}` : "none",
                }}
                title={a.label}
              >
                {accent === a.key && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Density */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--imp-faint)" }}>
            Density
          </div>
          <div className="flex gap-1">
            {DENSITIES.map((d) => (
              <button
                key={d.key}
                onClick={() => setDensity(d.key)}
                className="flex-1 h-7 rounded-lg text-[11.5px] font-medium transition-all"
                style={{
                  background: density === d.key ? "var(--imp-accent-soft)" : "var(--imp-surface-2)",
                  color: density === d.key ? "var(--imp-accent)" : "var(--imp-text-2)",
                  border: `1px solid ${density === d.key ? "var(--imp-accent-line)" : "var(--imp-border-2)"}`,
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
