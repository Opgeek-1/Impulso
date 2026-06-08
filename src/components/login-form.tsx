"use client";

import { useState, useRef } from "react";
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
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      setStep("code");
    } else {
      const data = await res.json();
      setError(data.error || "Failed to send code");
    }
    setLoading(false);
  }

  async function handleVerifyCode(codeStr?: string) {
    const finalCode = codeStr || code.join("");
    if (finalCode.length !== 6) return;

    setLoading(true);
    setError("");

    const result = await signIn("email-code", {
      email,
      code: finalCode,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid or expired code");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  function handleCodeChange(index: number, value: string) {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newCode = [...code];
      digits.forEach((d, i) => { if (index + i < 6) newCode[index + i] = d; });
      setCode(newCode);
      const nextIdx = Math.min(index + digits.length, 5);
      inputRefs.current[nextIdx]?.focus();
      if (newCode.every((c) => c !== "")) handleVerifyCode(newCode.join(""));
      return;
    }

    const newCode = [...code];
    newCode[index] = value.replace(/\D/g, "");
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every((c) => c !== "")) handleVerifyCode(newCode.join(""));
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
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
          {step === "email"
            ? "Sign in to manage your content pipeline"
            : `Enter the 6-digit code sent to ${email}`}
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={handleSendCode} className="space-y-4">
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
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full imp-btn-primary" disabled={loading}>
            {loading ? "Sending code..." : "Continue with email"}
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          {/* Code input boxes */}
          <div className="flex justify-center gap-2">
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleCodeChange(i, e.target.value)}
                onKeyDown={(e) => handleCodeKeyDown(i, e)}
                autoFocus={i === 0}
                className="w-10 h-12 text-center text-[18px] font-bold rounded-lg outline-none transition-colors"
                style={{
                  background: "var(--imp-surface-2)",
                  border: digit ? "1.5px solid var(--imp-accent)" : "1.5px solid var(--imp-border-2)",
                  color: "var(--imp-text)",
                }}
              />
            ))}
          </div>
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          <Button
            className="w-full imp-btn-primary"
            disabled={loading || code.some((c) => !c)}
            onClick={() => handleVerifyCode()}
          >
            {loading ? "Verifying..." : "Verify code"}
          </Button>
          <button
            onClick={() => { setStep("email"); setError(""); setCode(["", "", "", "", "", ""]); }}
            className="w-full text-[13px] font-medium py-1 transition-colors"
            style={{ color: "var(--imp-muted)" }}
          >
            Use a different email
          </button>
        </div>
      )}
    </div>
  );
}