"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, Minus, Plus, ArrowRight } from "lucide-react";

interface Project {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string | null;
}

interface GeneratePanelProps {
  project: Project;
  onComplete: () => void;
}

const TONES = [
  { id: "professional", label: "Professional" },
  { id: "casual", label: "Casual" },
  { id: "witty", label: "Witty" },
  { id: "authoritative", label: "Authoritative" },
  { id: "inspirational", label: "Inspirational" },
];

const LANGS = [
  { id: "en", label: "English" },
  { id: "zh", label: "中文" },
  { id: "ja", label: "日本語" },
  { id: "es", label: "Español" },
];

const PRESETS = [
  "Why database branching beats staging environments",
  "Cutting cloud spend by scaling to zero",
  "The hidden cost of capacity planning",
  "Postgres tips most teams miss",
];

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-8 px-3.5 rounded-full text-[12.5px] font-medium whitespace-nowrap transition-all"
      style={{
        border: `1px solid ${active ? "var(--imp-accent-line)" : "var(--imp-border-2)"}`,
        background: active ? "var(--imp-accent-soft)" : "var(--imp-surface-2)",
        color: active ? "var(--imp-accent)" : "var(--imp-text-2)",
      }}
    >
      {children}
    </button>
  );
}

function Stepper({ value, onChange, min = 1, max = 14 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-[10px] p-[3px]"
      style={{ background: "var(--imp-surface-2)", border: "1px solid var(--imp-border-2)" }}
    >
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-7 h-7 rounded-[7px] flex items-center justify-center border-none bg-transparent transition-colors"
        style={{ color: "var(--imp-text-2)" }}
      >
        <Minus size={14} />
      </button>
      <span className="w-[30px] text-center text-sm font-semibold font-mono" style={{ color: "var(--imp-text)" }}>
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-7 h-7 rounded-[7px] flex items-center justify-center border-none bg-transparent transition-colors"
        style={{ color: "var(--imp-text-2)" }}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      className="rounded-[14px] p-4 flex flex-col gap-3"
      style={{ background: "var(--imp-surface)", border: "1px solid var(--imp-border)" }}
    >
      <div className="flex items-center gap-2">
        <div className="imp-skel w-3 h-3 rounded" />
        <div className="imp-skel w-14 h-2.5 rounded" />
      </div>
      <div className="imp-skel w-full h-3 rounded" />
      <div className="imp-skel w-[92%] h-3 rounded" />
      <div className="imp-skel w-[70%] h-3 rounded" />
      <div className="imp-skel w-20 h-2.5 rounded mt-1" />
    </div>
  );
}

function DraftCard({ tweet, index, onDiscard }: { tweet: { id: string; content: string }; index: number; onDiscard: () => void }) {
  const len = tweet.content.length;
  return (
    <div
      className="imp-pop-in rounded-[14px] p-4 flex flex-col gap-3 imp-card"
      style={{
        background: "var(--imp-surface)",
        border: "1px solid var(--imp-border)",
        boxShadow: "var(--imp-shadow-sm)",
        animationDelay: `${index * 0.06}s`,
      }}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--imp-faint)" }}>
          <Sparkles size={12} style={{ color: "var(--imp-accent)" }} />
          Draft {index + 1}
        </div>
        <button
          onClick={onDiscard}
          className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] transition-colors"
          style={{ color: "var(--imp-faint)" }}
          title="Discard"
        >
          ✕
        </button>
      </div>
      <p className="m-0 text-[13.5px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--imp-text)" }}>
        {tweet.content}
      </p>
      <div className="flex items-center gap-2 mt-auto pt-1">
        <span className="font-mono text-[11px]" style={{ color: len > 280 ? "#f87171" : "var(--imp-faint)" }}>
          {len} / 280
        </span>
        <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: "var(--imp-surface-3)" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, (len / 280) * 100)}%`,
              background: len > 280 ? "#f87171" : "var(--imp-accent)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function GeneratePanel({ project, onComplete }: GeneratePanelProps) {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("professional");
  const [count, setCount] = useState(7);
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<{ id: string; content: string }[]>([]);

  async function handleGenerate() {
    if (!topic.trim()) {
      toast.error("Add a topic to generate from");
      return;
    }
    setLoading(true);
    setGenerated([]);

    try {
      const res = await fetch("/api/tweets/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          topic,
          tone,
          count,
          language,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate");

      const data = await res.json();
      setGenerated(data.tweets);
      toast.success(`Generated ${data.tweets.length} tweets`);
    } catch {
      toast.error("Failed to generate tweets. Check your AI API settings.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[1080px] mx-auto px-7 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="imp-fade-in">
        <h2 className="text-[22px] font-bold tracking-tight mb-1" style={{ color: "var(--imp-text)" }}>
          Generate drafts
        </h2>
        <p className="text-[13.5px] m-0" style={{ color: "var(--imp-muted)" }}>
          Describe a topic and Impulso writes a batch of tweet angles for{" "}
          <span className="font-mono" style={{ color: "var(--imp-text-2)" }}>@{project.handle}</span>.
        </p>
      </div>

      {/* Composer card */}
      <div
        className="imp-fade-in rounded-[18px] p-5 relative overflow-hidden"
        style={{
          background: "var(--imp-surface)",
          border: "1px solid var(--imp-border-2)",
          boxShadow: "var(--imp-shadow)",
        }}
      >
        {/* Subtle gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            background: "var(--imp-accent-grad)",
            maskImage: "radial-gradient(60% 120% at 90% -20%, #000, transparent)",
            WebkitMaskImage: "radial-gradient(60% 120% at 90% -20%, #000, transparent)",
            opacity: 0.08,
          }}
        />

        <div className="relative flex flex-col gap-0">
          <label className="text-[12.5px] font-semibold mb-2" style={{ color: "var(--imp-text-2)" }}>
            Topic or theme
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Why scaling your database to zero saves more than you think…"
            rows={3}
            className="w-full rounded-xl px-3.5 py-3 text-[15px] leading-relaxed outline-none transition-colors resize-none"
            style={{
              background: "var(--imp-bg)",
              border: "1px solid var(--imp-border-2)",
              color: "var(--imp-text)",
            }}
          />

          {/* Presets */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-[11.5px] self-center mr-0.5" style={{ color: "var(--imp-faint)" }}>Try:</span>
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setTopic(p)}
                className="h-7 px-3 rounded-full text-[12px] font-medium whitespace-nowrap bg-transparent transition-colors"
                style={{
                  border: "1px dashed var(--imp-border-strong)",
                  color: "var(--imp-muted)",
                }}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="h-px my-4" style={{ background: "var(--imp-border)" }} />

          {/* Options row */}
          <div className="flex flex-wrap gap-6 items-start">
            <div>
              <div className="text-[11.5px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--imp-faint)" }}>
                Tone
              </div>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <Chip key={t.id} active={tone === t.id} onClick={() => setTone(t.id)}>
                    {t.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[11.5px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--imp-faint)" }}>
                Drafts
              </div>
              <Stepper value={count} onChange={setCount} />
            </div>
            <div>
              <div className="text-[11.5px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--imp-faint)" }}>
                Language
              </div>
              <div className="flex flex-wrap gap-2">
                {LANGS.map((l) => (
                  <Chip key={l.id} active={language === l.id} onClick={() => setLanguage(l.id)}>
                    {l.label}
                  </Chip>
                ))}
              </div>
            </div>
          </div>

          {/* Generate button */}
          <div className="flex justify-end mt-5">
            <Button onClick={handleGenerate} disabled={loading || !topic.trim()} className="imp-btn-primary h-[42px] px-[18px] text-[13.5px] rounded-[9px]">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Generating…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Sparkles size={15} />
                  Generate {count} drafts
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div>
          <div className="flex items-end justify-between mb-4 gap-4 flex-wrap">
            <div>
              <h3 className="text-base font-semibold tracking-tight m-0 mb-0.5" style={{ color: "var(--imp-text)" }}>
                Writing drafts…
              </h3>
              <p className="text-[12.5px] m-0" style={{ color: "var(--imp-muted)" }}>
                Exploring {count} angles
              </p>
            </div>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] items-start" style={{ gap: "var(--imp-gap)" }}>
            {Array.from({ length: count }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      ) : generated.length > 0 ? (
        <div>
          <div className="flex items-end justify-between mb-4 gap-4 flex-wrap">
            <div>
              <h3 className="text-base font-semibold tracking-tight m-0 mb-0.5" style={{ color: "var(--imp-text)" }}>
                {generated.length} drafts ready
              </h3>
              <p className="text-[12.5px] m-0" style={{ color: "var(--imp-muted)" }}>
                Discard the weak ones, send the rest to Curate
              </p>
            </div>
            <Button onClick={onComplete} className="imp-btn-primary h-9 px-3.5 text-[13px] rounded-[9px]">
              <span className="inline-flex items-center gap-2">
                Send {generated.length} to Curate
                <ArrowRight size={15} />
              </span>
            </Button>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] items-start" style={{ gap: "var(--imp-gap)" }}>
            {generated.map((tweet, i) => (
              <DraftCard
                key={tweet.id}
                tweet={tweet}
                index={i}
                onDiscard={() => setGenerated((prev) => prev.filter((t) => t.id !== tweet.id))}
              />
            ))}
          </div>
        </div>
      ) : (
        <div
          className="text-center py-11 px-5 rounded-[18px]"
          style={{
            border: "1px dashed var(--imp-border-2)",
            background: "color-mix(in srgb, var(--imp-surface) 40%, transparent)",
          }}
        >
          <div
            className="w-[60px] h-[60px] mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{
              background: "var(--imp-accent-soft)",
              border: "1px solid var(--imp-accent-line)",
              color: "var(--imp-accent)",
            }}
          >
            <Sparkles size={26} />
          </div>
          <h3 className="text-base font-semibold mb-1" style={{ color: "var(--imp-text)" }}>
            Your drafts will appear here
          </h3>
          <p className="text-[13px] max-w-[360px] mx-auto leading-relaxed" style={{ color: "var(--imp-muted)" }}>
            Pick a topic, set the tone, and generate a batch. Everything starts as a draft you can curate, design, and schedule.
          </p>
        </div>
      )}
    </div>
  );
}
