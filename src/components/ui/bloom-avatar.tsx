"use client";

import { hashStr, rngFrom, triad } from "@/lib/avatar";

function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

interface BloomAvatarProps {
  seed: string;
  size?: number;
  shape?: "circle" | "squircle";
  dark?: boolean;
  className?: string;
}

export function BloomAvatar({
  seed,
  size = 40,
  shape = "circle",
  dark = false,
  className,
}: BloomAvatarProps) {
  const hsh = hashStr(seed);
  const rng = rngFrom(hsh);
  const [a, b, c] = triad(seed);

  const n = [5, 6, 8][hsh % 3];
  const ry = 19 + Math.round(rng() * 5);
  const blend = dark ? "screen" : "multiply";
  const radius = shape === "circle" ? size / 2 : Math.round(size * 0.3);
  const ring = dark ? "rgba(255,255,255,.06)" : hexA(a, 0.14);
  const bg = hexA(a, dark ? 0.2 : 0.12);

  const petals = [];
  for (let i = 0; i < n; i++) {
    petals.push(
      <ellipse
        key={i}
        cx="50"
        cy="30"
        rx="9"
        ry={ry}
        fill={i % 2 ? a : b}
        opacity="0.88"
        transform={`rotate(${(360 / n) * i} 50 50)`}
        style={{ mixBlendMode: blend }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        flexShrink: 0,
        overflow: "hidden",
        background: bg,
        boxShadow: `inset 0 0 0 1px ${ring}`,
      }}
      role="img"
      aria-label="Avatar"
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        {petals}
        <circle cx="50" cy="50" r="8" fill={c} />
      </svg>
    </div>
  );
}
