"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useTheme } from "next-themes";

export function LoginForm() {
  const router = useRouter();
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const callbackUrl =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("callbackUrl")
      : null;
  const safeCallbackUrl = callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push(safeCallbackUrl);
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
        <h1 className="text-xl font-bold" style={{ color: "var(--imp-text)" }}>Impulso</h1>
        <p className="text-[13px] mt-1 text-center" style={{ color: "var(--imp-muted)" }}>
          Sign in to manage your content pipeline
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" className="w-full imp-btn-primary" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-[13px] mt-4" style={{ color: "var(--imp-muted)" }}>
        Don&apos;t have an account?{" "}
        <a href="/register" className="font-medium" style={{ color: "var(--imp-accent)" }}>
          Sign up
        </a>
      </p>
    </div>
  );
}
