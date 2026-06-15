"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import { locales, type Locale } from "@/i18n/config";
import { setUserLocale } from "@/app/actions/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LABELS: Record<Locale, string> = {
  en: "English",
  "zh-CN": "简体中文",
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const t = useTranslations("language");
  const [isPending, startTransition] = useTransition();

  function setLocale(nextLocale: Locale) {
    startTransition(async () => {
      await setUserLocale(nextLocale);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="imp-icon-btn h-8 min-w-8 px-2 flex items-center justify-center gap-1.5"
        style={{ color: "var(--imp-text-2)" }}
        title={t("switchLanguage")}
      >
        <Languages size={16} />
        <span className="text-[11.5px] font-semibold">{locale === "zh-CN" ? "中" : "EN"}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {locales.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => setLocale(option)}
            disabled={isPending}
            className="justify-between text-[13px]"
          >
            {LABELS[option]}
            {option === locale && <span style={{ color: "var(--imp-accent)" }}>✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
