"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ACCENTS = [
  { key: "tomo", hex: "#FE3C9C", labelKey: "pink" },
  { key: "sky", hex: "#0ea5e9", labelKey: "sky" },
  { key: "indigo", hex: "#6366f1", labelKey: "indigo" },
  { key: "violet", hex: "#a855f7", labelKey: "violet" },
];

const DENSITIES = [
  { key: "compact", labelKey: "compact" },
  { key: "regular", labelKey: "regular" },
  { key: "comfy", labelKey: "comfy" },
];

function getStoredPreference(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(key) || fallback;
}

export function SettingsPopover() {
  const t = useTranslations("settings");
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
        title={t("title")}
      >
        <Settings size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-3">
        {/* Accent */}
        <div className="mb-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--imp-faint)" }}>
            {t("accent_color")}
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
                title={t(a.labelKey)}
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
            {t("density")}
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
                {t(d.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
