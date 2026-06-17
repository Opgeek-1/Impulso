"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";

export function RegisterForm() {
  const router = useRouter();
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || t("somethingWentWrong"));
      setLoading(false);
    } else {
      router.push("/login");
    }
  }

  return (
    <div
      className="relative w-full max-w-sm rounded-2xl p-8"
      style={{
        background: "var(--imp-surface)",
        border: "1px solid var(--imp-border-2)",
        boxShadow: "var(--imp-shadow)",
      }}
    >
      <div className="absolute right-3 top-3">
        <LanguageSwitcher />
      </div>
      <div className="flex flex-col items-center mb-6">
        <Image src="/tomo-mark.png" alt="Impulso" width={40} height={40} className="mb-3" />
        <h1 className="text-xl font-bold" style={{ color: "var(--imp-text)" }}>Impulso</h1>
        <p className="text-[13px] mt-1" style={{ color: "var(--imp-muted)" }}>
          {t("registerSubtitle")}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{common("name")}</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{common("email")}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{common("password")}</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t("creatingAccount") : t("signUp")}
        </Button>
        <p className="text-[13px] text-center" style={{ color: "var(--imp-muted)" }}>
          {t("alreadyHaveAccount")}{" "}
          <Link href="/login" className="font-medium" style={{ color: "var(--imp-accent)" }}>{common("signIn")}</Link>
        </p>
      </form>
    </div>
  );
}
