"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

const LOCALES = [
  { id: "en", label: "English" },
  { id: "zh", label: "中文" },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("settings");
  const [isPending, startTransition] = useTransition();

  async function switchLocale(newLocale: string) {
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: newLocale }),
    });
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-between py-5" style={{ borderBottom: "1px solid var(--imp-border)" }}>
      <div>
        <div className="text-[15px] font-semibold" style={{ color: "var(--imp-text)" }}>{t("language")}</div>
        <div className="text-[13px] mt-0.5" style={{ color: "var(--imp-muted)" }}>{t("language_desc")}</div>
      </div>
      <div
        className="flex items-center h-[38px] rounded-full p-1 gap-0.5"
        style={{ background: "var(--imp-surface-2)", border: "1px solid var(--imp-border)", opacity: isPending ? 0.6 : 1 }}
      >
        {LOCALES.map((l) => (
          <button
            key={l.id}
            onClick={() => switchLocale(l.id)}
            disabled={isPending}
            className="h-[30px] px-4 rounded-full text-[13px] font-medium transition-all"
            style={{
              background: locale === l.id ? "var(--imp-surface)" : "transparent",
              color: locale === l.id ? "var(--imp-accent)" : "var(--imp-muted)",
              boxShadow: locale === l.id ? "var(--imp-shadow-sm)" : "none",
            }}
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}
