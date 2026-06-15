"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useTheme } from "next-themes";

interface AcceptInviteFormProps {
  token: string;
  workspaceName: string;
  inviterName: string;
}

export function AcceptInviteForm({ token, workspaceName, inviterName }: AcceptInviteFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const loginHref = `/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError(t("password_min_length"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("passwords_no_match"));
      return;
    }

    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();

    const res = await fetch("/api/auth/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, name: name.trim() || undefined, email: normalizedEmail, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || t("accept_invite_failed"));
      setLoading(false);
      return;
    }

    // Auto sign in
    const result = await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(t("account_created_signin_failed"));
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div
      className="w-full max-w-sm rounded-2xl p-8"
      style={{
        background: "var(--imp-surface)",
        border: "1px solid var(--imp-border-2)",
        boxShadow: "var(--imp-shadow)",
      }}
    >
      <div className="flex flex-col items-center mb-6">
        <Image
          src={theme === "dark" ? "/tomo-mark.png" : "/tomo-mark-color.png"}
          alt="Impulso"
          width={40}
          height={40}
          className="mb-3"
        />
        <h1 className="text-xl font-bold" style={{ color: "var(--imp-text)" }}>{t("join_workspace", { workspaceName })}</h1>
        <p className="text-[13px] mt-1 text-center" style={{ color: "var(--imp-muted)" }}>
          {t("invited_to_collaborate", { inviterName })}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">{t("name")}</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("your_name")}
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("at_least_6_chars")}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t("confirm_password")}</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" className="w-full imp-btn-primary" disabled={loading}>
          {loading ? t("setting_up") : t("set_password_join")}
        </Button>
      </form>

      <p className="text-center text-[13px] mt-4" style={{ color: "var(--imp-muted)" }}>
        {t("have_account")}{" "}
        <a href={loginHref} className="font-medium" style={{ color: "var(--imp-accent)" }}>
          {t("sign_in_first")}
        </a>
      </p>
    </div>
  );
}
