const PAIRS: [string, string][] = [
  ["#FE3C9C", "#ff6fb8"],
  ["#0ea5e9", "#22d3ee"],
  ["#a855f7", "#e879f9"],
  ["#22c55e", "#4ade80"],
  ["#f59e0b", "#fb923c"],
  ["#6366f1", "#818cf8"],
  ["#06b6d4", "#818cf8"],
  ["#ec4899", "#f97316"],
];

export function hashStr(s: string | null | undefined): number {
  const str = String(s || "?");
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rngFrom(seed: number): () => number {
  let s = (seed || 1) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function triad(seed: string): [string, string, string] {
  const hsh = hashStr(seed);
  const [a, b] = PAIRS[hsh % PAIRS.length];
  const c = PAIRS[(hsh * 7 + 3) % PAIRS.length][hsh % 2];
  return [a, b, c];
}

export function pairFor(seed: string): [string, string] {
  return PAIRS[hashStr(seed) % PAIRS.length];
}

export { PAIRS, hexA };
