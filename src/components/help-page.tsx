"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { TopNav } from "@/components/top-nav";
import { Sparkles, MousePointerClick, CalendarDays, Send, ArrowRight } from "lucide-react";

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
  user: { id?: string; name?: string | null; email?: string | null; avatarSeed?: string | null };
}

const STEP_ICONS = [Sparkles, MousePointerClick, CalendarDays, Send];
const STEP_COLORS = ["#FE3C9C", "#f59e0b", "#0ea5e9", "#22c55e"];
const STEP_KEYS = ["generate", "curate", "schedule", "publish"] as const;

const HELP_TIP_KEYS = ["brandKit", "accountBrief", "multipleAccounts", "imageStyles"] as const;

export function HelpPage({ projects, user }: HelpPageProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(projects[0] ?? null);
  const t = useTranslations("manual");

  const steps = STEP_KEYS.map((key, i) => ({
    number: i + 1,
    icon: STEP_ICONS[i],
    color: STEP_COLORS[i],
    title: t(`sections.${key}.title`),
    description: t(`sections.${key}.description`),
    details: key === "curate"
      ? [0,1,2,3,4].map(j => t(`sections.${key}.details.${j}`))
      : [0,1,2,3].map(j => t(`sections.${key}.details.${j}`)),
  }));

  const tips = HELP_TIP_KEYS.map(key => ({
    title: t(`helpTips.${key}.title`),
    text: t(`helpTips.${key}.text`),
  }));

  return (
    <div className="flex flex-col h-screen">
      <TopNav projects={projects} selected={selectedProject} onSelect={setSelectedProject} onCreated={() => {}} user={user} />
      <div className="flex-1 overflow-y-auto" style={{ background: "var(--imp-bg)" }}>
        <div className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="text-[28px] font-bold mb-2" style={{ color: "var(--imp-text)" }}>
            {t("guideTitle")}
          </h1>
          <p className="text-[15px] mb-10" style={{ color: "var(--imp-muted)" }}>
            {t("guideSubtitle")}
          </p>

          <div className="flex flex-col gap-6">
            {steps.map((step, i) => (
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
                      {step.title}
                    </h2>
                  </div>
                  <p className="text-[14px] mb-4" style={{ color: "var(--imp-muted)" }}>
                    {step.description}
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {step.details.map((d, j) => (
                      <li key={j} className="flex items-start gap-2 text-[13.5px]" style={{ color: "var(--imp-text)" }}>
                        <ArrowRight size={13} className="mt-[3px] shrink-0" style={{ color: step.color }} />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div className="w-px h-4" style={{ background: "var(--imp-border)" }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <h2 className="text-[20px] font-bold mt-12 mb-4" style={{ color: "var(--imp-text)" }}>
            {t("tipsTitle")}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {tips.map((tip) => (
              <div
                key={tip.title}
                className="rounded-xl p-5"
                style={{ background: "var(--imp-surface)", border: "1px solid var(--imp-border)" }}
              >
                <h3 className="text-[14px] font-bold mb-1.5" style={{ color: "var(--imp-text)" }}>
                  {tip.title}
                </h3>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--imp-muted)" }}>
                  {tip.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 mb-8 text-center text-[13px]" style={{ color: "var(--imp-muted)" }}>
            {t("needHelp")} <a href="mailto:support@tomo.inc" className="underline">support@tomo.inc</a>
          </div>
        </div>
      </div>
    </div>
  );
}
