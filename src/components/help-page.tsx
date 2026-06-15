"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { TopNav } from "@/components/top-nav";
import { Sparkles, MousePointerClick, ImageIcon, CalendarDays, Send, ArrowRight } from "lucide-react";

interface Project {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  avatarUrl?: string | null;
  _count: { tweets: number };
}

interface HelpPageProps {
  projects: Project[];
  user: { id?: string; name?: string | null; email?: string | null };
}

const STEPS = [
  { number: 1, icon: Sparkles, color: "#FE3C9C", titleKey: "generate_title", descKey: "generate_desc", detailsKey: "generate_details" },
  { number: 2, icon: MousePointerClick, color: "#f59e0b", titleKey: "curate_title", descKey: "curate_desc", detailsKey: "curate_details" },
  { number: 3, icon: CalendarDays, color: "#0ea5e9", titleKey: "schedule_title", descKey: "schedule_desc", detailsKey: "schedule_details" },
  { number: 4, icon: Send, color: "#22c55e", titleKey: "publish_title", descKey: "publish_desc", detailsKey: "publish_details" },
];

const TIPS_KEYS = [
  { titleKey: "tip_brand_kit_title", textKey: "tip_brand_kit" },
  { titleKey: "tip_account_brief_title", textKey: "tip_account_brief" },
  { titleKey: "tip_multiple_accounts_title", textKey: "tip_multiple_accounts" },
  { titleKey: "tip_image_styles_title", textKey: "tip_image_styles" },
];

export function HelpPage({ projects, user }: HelpPageProps) {
  const t = useTranslations("help");
  const [selectedProject, setSelectedProject] = useState<Project | null>(projects[0] ?? null);

  return (
    <div className="flex flex-col h-screen">
      <TopNav projects={projects} selected={selectedProject} onSelect={setSelectedProject} onCreated={() => {}} user={user} />
      <div className="flex-1 overflow-y-auto" style={{ background: "var(--imp-bg)" }}>
        <div className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="text-[28px] font-bold mb-2" style={{ color: "var(--imp-text)" }}>
            {t("title")}
          </h1>
          <p className="text-[15px] mb-10" style={{ color: "var(--imp-muted)" }}>
            {t("subtitle")}
          </p>

          <div className="flex flex-col gap-6">
            {STEPS.map((step, i) => {
              const details = t.raw(step.detailsKey) as string[];
              return (
                <div key={step.number}>
                  <div
                    className="rounded-2xl p-6 transition-all"
                    style={{ background: "var(--imp-surface)", border: "1px solid var(--imp-border)" }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[14px] font-bold"
                        style={{ background: step.color }}
                      >
                        {step.number}
                      </div>
                      <step.icon size={20} style={{ color: step.color }} />
                      <h2 className="text-[18px] font-bold" style={{ color: "var(--imp-text)" }}>
                        {t(step.titleKey)}
                      </h2>
                    </div>
                    <p className="text-[14px] mb-4" style={{ color: "var(--imp-muted)" }}>
                      {t(step.descKey)}
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {details.map((d: string, j: number) => (
                        <li key={j} className="flex items-start gap-2 text-[13.5px]" style={{ color: "var(--imp-text)" }}>
                          <ArrowRight size={13} className="mt-[3px] shrink-0" style={{ color: step.color }} />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex justify-center py-1">
                      <div className="w-px h-4" style={{ background: "var(--imp-border)" }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <h2 className="text-[20px] font-bold mt-12 mb-4" style={{ color: "var(--imp-text)" }}>
            {t("tips")}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {TIPS_KEYS.map((tip) => (
              <div
                key={tip.titleKey}
                className="rounded-xl p-5"
                style={{ background: "var(--imp-surface)", border: "1px solid var(--imp-border)" }}
              >
                <h3 className="text-[14px] font-bold mb-1.5" style={{ color: "var(--imp-text)" }}>
                  {t(tip.titleKey)}
                </h3>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--imp-muted)" }}>
                  {t(tip.textKey)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 mb-8 text-center text-[13px]" style={{ color: "var(--imp-muted)" }}>
            {t("need_help")} <a href="mailto:support@tomo.inc" className="underline">support@tomo.inc</a>
          </div>
        </div>
      </div>
    </div>
  );
}
