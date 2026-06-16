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

function getStoredPreference(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(key) || fallback;
}

export function SettingsPopover() {
  const [accent, setAccent] = useState(() => getStoredPreference("impulso-accent", "tomo"));

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent);
    localStorage.setItem("impulso-accent", accent);
  }, [accent]);

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

      </DropdownMenuContent>
    </DropdownMenu>
  );
}
