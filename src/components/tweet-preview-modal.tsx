"use client";

import { Eye, X, Clock, Check, Copy, MessageCircle, Repeat2, Heart, BarChart3, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { toast } from "sonner";

interface Tweet {
  id: string;
  content: string;
  status: string;
  imageUrl?: string | null;
  scheduledAt?: string | null;
}

interface Project {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string | null;
}

interface TweetPreviewModalProps {
  tweet: Tweet;
  project: Project;
  onClose: () => void;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: "Draft", color: "var(--s-draft)", bg: "var(--s-draft-bg)" },
  CURATED: { label: "Curated", color: "var(--s-curated)", bg: "var(--s-curated-bg)" },
  DESIGNED: { label: "Designed", color: "var(--s-designed)", bg: "var(--s-designed-bg)" },
  IMAGE_GENERATED: { label: "Image ready", color: "var(--s-image)", bg: "var(--s-image-bg)" },
  SCHEDULED: { label: "Scheduled", color: "var(--s-sched)", bg: "var(--s-sched-bg)" },
};

export function TweetPreviewModal({ tweet, project, onClose }: TweetPreviewModalProps) {
  const status = STATUS_MAP[tweet.status] || STATUS_MAP.DRAFT;

  function formatSchedule(iso: string) {
    const d = new Date(iso);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let hh = d.getHours();
    const mm = d.getMinutes();
    const ap = hh >= 12 ? "PM" : "AM";
    hh = hh % 12 || 12;
    const time = hh + (mm ? ":" + String(mm).padStart(2, "0") : ":00") + " " + ap;
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()} · ${time}`;
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: "rgba(5,7,12,0.5)", backdropFilter: "blur(6px)" }} />

      {/* Modal */}
      <div
        className="relative w-full max-w-[524px] rounded-[18px] imp-pop-in"
        style={{
          background: "var(--imp-surface)",
          border: "1px solid var(--imp-border-2)",
          boxShadow: "0 24px 60px -24px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3.5"
          style={{ borderBottom: "1px solid var(--imp-border)" }}
        >
          <div className="flex items-center gap-2.5">
            <Eye size={16} style={{ color: "var(--imp-accent)" }} />
            <span className="text-[13px] font-semibold" style={{ color: "var(--imp-text)" }}>Post preview</span>
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ color: status.color, background: status.bg }}
            >
              <span className="w-[5px] h-[5px] rounded-full" style={{ background: status.color }} />
              {status.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="imp-icon-btn w-7 h-7 flex items-center justify-center"
            style={{ color: "var(--imp-muted)" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Post content */}
        <div className="px-[18px] pt-[18px] pb-1.5">
          {/* Author row */}
          <div className="flex items-center gap-3 mb-3">
            {project.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={project.avatarUrl} alt={project.name} className="w-[46px] h-[46px] object-cover shrink-0" style={{ borderRadius: "32%" }} />
            ) : (
              <div
                className="w-[46px] h-[46px] flex items-center justify-center text-lg font-bold shrink-0"
                style={{ background: "var(--imp-accent-grad)", color: "var(--imp-on-accent)", borderRadius: "32%" }}
              >
                {project.name[0]}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-bold" style={{ color: "var(--imp-text)" }}>{project.name}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--imp-accent)" stroke="none">
                  <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3L12 14.1l-4.8 2.5.9-5.3-3.8-3.7 5.3-.8z"/>
                  <path d="M9.5 12.5l2 2 3.5-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[13.5px] font-mono" style={{ color: "var(--imp-muted)" }}>@{project.handle}</span>
                <span className="text-[13.5px]" style={{ color: "var(--imp-faint)" }}>· {tweet.status === "SCHEDULED" ? "scheduled" : "draft"}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <p className="text-[16px] leading-[1.5] whitespace-pre-wrap m-0 mb-3" style={{ color: "var(--imp-text)", letterSpacing: "-0.003em" }}>
            {tweet.content}
          </p>

          {/* Image */}
          {tweet.imageUrl && (
            <ImageLightbox
              src={tweet.imageUrl.startsWith("http") || tweet.imageUrl.startsWith("/") ? tweet.imageUrl : `data:image/png;base64,${tweet.imageUrl}`}
              alt="AI generated"
            >
              <div className="rounded-2xl overflow-hidden mb-3 relative" style={{ border: "1px solid var(--imp-border-2)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tweet.imageUrl.startsWith("http") || tweet.imageUrl.startsWith("/") ? tweet.imageUrl : `data:image/png;base64,${tweet.imageUrl}`}
                  alt="AI generated"
                  className="w-full h-[264px] object-cover"
                />
                <span className="absolute left-2 bottom-2 text-[9.5px] font-semibold uppercase tracking-wider text-white/85 flex items-center gap-1">
                  ✦ AI GENERATED
                </span>
              </div>
            </ImageLightbox>
          )}

          {/* Schedule info */}
          {tweet.scheduledAt ? (
            <div className="flex items-center gap-1.5 text-[13px]" style={{ color: "var(--imp-muted)" }}>
              <Clock size={14} style={{ color: "var(--s-sched)" }} />
              <span>Scheduled for</span>
              <span className="font-semibold" style={{ color: "var(--imp-text)" }}>{formatSchedule(tweet.scheduledAt)}</span>
            </div>
          ) : (
            <div className="text-[13px]" style={{ color: "var(--imp-faint)" }}>
              Draft preview · not yet scheduled
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="mx-[18px] my-3" style={{ borderTop: "1px solid var(--imp-border)" }}>
          <div className="flex items-center justify-around py-3">
            <span className="flex items-center gap-1.5 text-[13px]" style={{ color: "var(--imp-muted)" }}>
              <MessageCircle size={16} /> <span className="font-mono">24</span>
            </span>
            <span className="flex items-center gap-1.5 text-[13px]" style={{ color: "var(--s-image)" }}>
              <Repeat2 size={16} /> <span className="font-mono">112</span>
            </span>
            <span className="flex items-center gap-1.5 text-[13px]" style={{ color: "#f43f5e" }}>
              <Heart size={16} /> <span className="font-mono">1.2K</span>
            </span>
            <span className="flex items-center gap-1.5 text-[13px]" style={{ color: "var(--imp-muted)" }}>
              <BarChart3 size={16} /> <span className="font-mono">38K</span>
            </span>
            <span className="flex items-center gap-1.5 text-[13px]" style={{ color: "var(--imp-muted)" }}>
              <Send size={16} />
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-[18px] py-3"
          style={{ borderTop: "1px solid var(--imp-border)" }}
        >
          <span className="text-[11.5px]" style={{ color: "var(--imp-faint)" }}>
            Engagement shown is a projection
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[12.5px] gap-1.5"
              onClick={() => { navigator.clipboard.writeText(tweet.content); toast.success("Copied"); }}
            >
              <Copy size={13} /> Copy
            </Button>
            <Button
              size="sm"
              className="imp-btn-primary h-8 text-[12.5px] gap-1.5 rounded-[8px]"
              onClick={onClose}
            >
              <Check size={13} /> Looks good
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
