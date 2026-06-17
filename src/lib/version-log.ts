export type VersionEntry = {
  version: string;
  date: string;
  changes: string[];
};

export const VERSION_LOG: VersionEntry[] = [
  {
    version: "1.2.0",
    date: "2026-06-16",
    changes: [
      "Added Version tab in settings to track update history",
      "Full Chinese (zh-CN) localization for all UI strings",
      "Replaced hardcoded English text with i18n throughout the app",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-06-10",
    changes: [
      "Image upload and paste support in the curate panel",
      "Copyable image prompts for generated visuals",
      "Editable account display names with auto-sync from X profile",
      "Brand kit panel with logo, colors, and reusable visual briefs",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-06-01",
    changes: [
      "Initial release of Impulso",
      "AI-powered tweet generation pipeline",
      "Multi-account support with per-account briefs and schedules",
      "Image style management and generation",
      "Dark / light theme with accent color customization",
    ],
  },
];
