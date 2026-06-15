"use client";

import { useTranslations } from "next-intl";
import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ImageIcon,
  Lightbulb,
  Palette,
  Send,
  Sparkles,
  Users,
} from "lucide-react";

const WORKFLOW_SECTIONS = [
  {
    key: "generate",
    icon: Sparkles,
    color: "var(--imp-accent)",
  },
  {
    key: "curate",
    icon: Palette,
    color: "var(--s-designed)",
  },
  {
    key: "schedule",
    icon: CalendarClock,
    color: "var(--s-sched)",
  },
] as const;

const QUICK_REFERENCES = [
  { key: "accountSetup", icon: Users },
  { key: "copyStatus", icon: CheckCircle2 },
  { key: "images", icon: ImageIcon },
  { key: "publishing", icon: Send },
] as const;

export function ManualPanel() {
  const t = useTranslations("manual");

  return (
    <div className="min-h-full px-6 py-6" style={{ background: "var(--imp-bg-grad)" }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section
          className="rounded-[8px] px-5 py-5"
          style={{
            background: "var(--imp-surface)",
            border: "1px solid var(--imp-border)",
            boxShadow: "var(--imp-shadow-sm)",
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--imp-accent)" }}>
                <BookOpen size={15} />
                {t("eyebrow")}
              </div>
              <h1 className="m-0 text-[26px] font-bold leading-tight" style={{ color: "var(--imp-text)" }}>
                {t("title")}
              </h1>
              <p className="mb-0 mt-3 text-[14px] leading-6" style={{ color: "var(--imp-text-2)" }}>
                {t("subtitle")}
              </p>
            </div>
            <div
              className="flex min-w-[210px] flex-col gap-2 rounded-[8px] px-4 py-3"
              style={{ background: "var(--imp-surface-2)", border: "1px solid var(--imp-border-2)" }}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--imp-faint)" }}>
                {t("recommendedFlow")}
              </span>
              <span className="text-[13px] font-semibold" style={{ color: "var(--imp-text)" }}>
                {t("flow")}
              </span>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {WORKFLOW_SECTIONS.map((section, index) => {
            const Icon = section.icon;
            return (
              <article
                key={section.key}
                className="rounded-[8px] p-4"
                style={{
                  background: "var(--imp-surface)",
                  border: "1px solid var(--imp-border)",
                  boxShadow: "var(--imp-shadow-sm)",
                }}
              >
                <div className="mb-4 flex items-start gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px]"
                    style={{
                      background: "var(--imp-surface-3)",
                      border: "1px solid var(--imp-border-2)",
                      color: section.color,
                    }}
                  >
                    <Icon size={18} />
                  </span>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--imp-faint)" }}>
                      {t("step", { number: index + 1 })}
                    </div>
                    <h2 className="m-0 text-[17px] font-bold" style={{ color: "var(--imp-text)" }}>
                      {t(`sections.${section.key}.title`)}
                    </h2>
                    <p className="m-0 text-[12.5px]" style={{ color: "var(--imp-muted)" }}>
                      {t(`sections.${section.key}.eyebrow`)}
                    </p>
                  </div>
                </div>
                <ol className="m-0 flex list-none flex-col gap-2 p-0">
                  {[0, 1, 2, 3].map((stepIndex) => (
                    <li key={stepIndex} className="flex gap-2 text-[13px] leading-5" style={{ color: "var(--imp-text-2)" }}>
                      <span className="mt-[2px] font-mono text-[11px]" style={{ color: section.color }}>
                        {String(stepIndex + 1).padStart(2, "0")}
                      </span>
                      <span>{t(`sections.${section.key}.steps.${stepIndex}`)}</span>
                    </li>
                  ))}
                </ol>
              </article>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div
            className="rounded-[8px] p-4"
            style={{
              background: "var(--imp-surface)",
              border: "1px solid var(--imp-border)",
              boxShadow: "var(--imp-shadow-sm)",
            }}
          >
            <h2 className="m-0 mb-4 text-[16px] font-bold" style={{ color: "var(--imp-text)" }}>
              {t("quickReference")}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {QUICK_REFERENCES.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.key}
                    className="rounded-[8px] p-3"
                    style={{ background: "var(--imp-surface-2)", border: "1px solid var(--imp-border)" }}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Icon size={15} style={{ color: "var(--imp-accent)" }} />
                      <h3 className="m-0 text-[13.5px] font-semibold" style={{ color: "var(--imp-text)" }}>
                        {t(`quick.${item.key}.title`)}
                      </h3>
                    </div>
                    <p className="m-0 text-[12.5px] leading-5" style={{ color: "var(--imp-muted)" }}>
                      {t(`quick.${item.key}.text`)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <aside
            className="rounded-[8px] p-4"
            style={{
              background: "var(--imp-surface)",
              border: "1px solid var(--imp-border)",
              boxShadow: "var(--imp-shadow-sm)",
            }}
          >
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb size={16} style={{ color: "var(--s-sched)" }} />
              <h2 className="m-0 text-[16px] font-bold" style={{ color: "var(--imp-text)" }}>
                {t("workingTips")}
              </h2>
            </div>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {[0, 1, 2, 3].map((tipIndex) => (
                <li key={tipIndex} className="text-[13px] leading-5" style={{ color: "var(--imp-text-2)" }}>
                  {t(`tips.${tipIndex}`)}
                </li>
              ))}
            </ul>
          </aside>
        </section>
      </div>
    </div>
  );
}
