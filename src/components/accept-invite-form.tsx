"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useTheme } from "next-themes";

interface AcceptInviteFormProps {
  token: string;
  email: string;
  workspaceName: string;
  inviterName: string;
}

export function AcceptInviteForm({ token, email, workspaceName, inviterName }: AcceptInviteFormProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, name: name.trim() || undefined, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to accept invite");
      setLoading(false);
      return;
    }

    // Auto sign in
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Account created but sign in failed. Please go to login.");
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
        <h1 className="text-xl font-bold" style={{ color: "var(--imp-text)" }}>Join {workspaceName}</h1>
        <p className="text-[13px] mt-1 text-center" style={{ color: "var(--imp-muted)" }}>
          {inviterName} invited you to collaborate on Impulso
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            disabled
            className="opacity-60"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
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
            placeholder="At least 6 characters"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
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
          {loading ? "Setting up..." : "Set password & join"}
        </Button>
      </form>

      <p className="text-center text-[13px] mt-4" style={{ color: "var(--imp-muted)" }}>
        Already have an account?{" "}
        <a href="/login" className="font-medium" style={{ color: "var(--imp-accent)" }}>
          Sign in
        </a>
      </p>
    </div>
  );
}
