"use client";

import { useState } from "react";
import { TopNav } from "@/components/top-nav";
import { Sparkles, MousePointerClick, ImageIcon, CalendarDays, Send, ArrowRight } from "lucide-react";

interface Project {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  avatarUrl?: string | null;
  _count: { tweets: number };
}

interface HelpPageProps {
  projects: Project[];
  user: { id?: string; name?: string | null; email?: string | null };
}

const STEPS = [
  {
    number: 1,
    icon: Sparkles,
    title: "Generate",
    color: "#FE3C9C",
    description: "Describe a topic or theme and Impulso writes a batch of tweet angles for your account.",
    details: [
      "Enter a topic, trend, or idea you want to post about",
      "Choose a tone: Professional, Casual, Witty, Authoritative, Inspirational, or Custom",
      "Select a language and number of drafts to generate",
      "AI produces multiple tweet variations you can review",
    ],
  },
  {
    number: 2,
    icon: MousePointerClick,
    title: "Curate & Design",
    color: "#f59e0b",
    description: "Review drafts, approve the ones you like, add design briefs, and generate images.",
    details: [
      "Drag cards across four stages: Draft → Curated → Designed → Image ready",
      "Approve drafts to move them to the Curated column",
      "Add a visual brief describing the image you want",
      "Generate images with AI (GPT Image, Gemini Flash, or DALL·E 3)",
      "Regenerate images with feedback until they look right",
    ],
  },
  {
    number: 3,
    icon: CalendarDays,
    title: "Schedule",
    color: "#0ea5e9",
    description: "Drag ready posts onto your weekly calendar to plan when each tweet goes out.",
    details: [
      "Ready posts appear in the tray on the left",
      "Drag them onto any day of the week",
      "Set the exact time for each post",
      "Preview how the post will look on X before publishing",
    ],
  },
  {
    number: 4,
    icon: Send,
    title: "Publish",
    color: "#22c55e",
    description: "Impulso publishes your scheduled tweets automatically via your connected X account.",
    details: [
      "Connect each X account independently in Settings → X accounts",
      "Scheduled posts are published automatically at the set time",
      "Track post status: Scheduled → Publishing → Posted",
      "View engagement after a post goes live",
    ],
  },
];

const TIPS = [
  { title: "Brand kit", text: "Upload your logo, set brand colors, and add style notes in Settings → Brand kit. AI-generated images will follow your brand guidelines." },
  { title: "Account brief", text: "Write a short brief for each X account in Settings → Account brief. This helps the AI understand your voice and audience." },
  { title: "Multiple accounts", text: "Add as many X accounts as you need. Each keeps its own pipeline, schedule, and image styles." },
  { title: "Image styles", text: "Create reusable image style templates per account so your visuals stay consistent across posts." },
];

export function HelpPage({ projects, user }: HelpPageProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(projects[0] ?? null);

  return (
    <div className="flex flex-col h-screen">
      <TopNav projects={projects} selected={selectedProject} onSelect={setSelectedProject} onCreated={() => {}} user={user} />
      <div className="flex-1 overflow-y-auto" style={{ background: "var(--imp-bg)" }}>
        <div className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="text-[28px] font-bold mb-2" style={{ color: "var(--imp-text)" }}>
            Marketing Pipeline Guide
          </h1>
          <p className="text-[15px] mb-10" style={{ color: "var(--imp-muted)" }}>
            Impulso turns a topic into scheduled posts in four steps. Here&apos;s how the pipeline works.
          </p>

          <div className="flex flex-col gap-6">
            {STEPS.map((step, i) => (
              <div key={step.number}>
                <div
                  className="rounded-2xl p-6 transition-all"
                  style={{ background: "var(--imp-surface)", border: "1px solid var(--imp-border)" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[14px] font-bold"
                      style={{ background: step.color }}
                    >
                      {step.number}
                    </div>
                    <step.icon size={20} style={{ color: step.color }} />
                    <h2 className="text-[18px] font-bold" style={{ color: "var(--imp-text)" }}>
                      {step.title}
                    </h2>
                  </div>
                  <p className="text-[14px] mb-4" style={{ color: "var(--imp-muted)" }}>
                    {step.description}
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {step.details.map((d, j) => (
                      <li key={j} className="flex items-start gap-2 text-[13.5px]" style={{ color: "var(--imp-text)" }}>
                        <ArrowRight size={13} className="mt-[3px] shrink-0" style={{ color: step.color }} />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div className="w-px h-4" style={{ background: "var(--imp-border)" }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <h2 className="text-[20px] font-bold mt-12 mb-4" style={{ color: "var(--imp-text)" }}>
            Tips
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {TIPS.map((tip) => (
              <div
                key={tip.title}
                className="rounded-xl p-5"
                style={{ background: "var(--imp-surface)", border: "1px solid var(--imp-border)" }}
              >
                <h3 className="text-[14px] font-bold mb-1.5" style={{ color: "var(--imp-text)" }}>
                  {tip.title}
                </h3>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--imp-muted)" }}>
                  {tip.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 mb-8 text-center text-[13px]" style={{ color: "var(--imp-muted)" }}>
            Need more help? Reach out at <a href="mailto:support@tomo.inc" className="underline">support@tomo.inc</a>
          </div>
        </div>
      </div>
    </div>
  );
}
