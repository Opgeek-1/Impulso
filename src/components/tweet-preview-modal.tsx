"use client";

import { useEffect, useState } from "react";
import { Eye, X, Clock, Check, Copy, MessageCircle, Repeat2, Heart, BarChart3, Send, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface Tweet {
  id: string;
  content: string;
  status: string;
  imageUrl?: string | null;
  scheduledAt?: string | null;
  externalPostId?: string | null;
  publishedAt?: string | null;
  publishError?: string | null;
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
  onPublished?: (tweet: Tweet) => void;
}

const STATUS_MAP: Record<string, { labelKey: string; color: string; bg: string }> = {
  DRAFT: { labelKey: "draft", color: "var(--s-draft)", bg: "var(--s-draft-bg)" },
  CURATED: { labelKey: "curated", color: "var(--s-curated)", bg: "var(--s-curated-bg)" },
  DESIGNED: { labelKey: "designed", color: "var(--s-designed)", bg: "var(--s-designed-bg)" },
  IMAGE_GENERATED: { labelKey: "imageReady", color: "var(--s-image)", bg: "var(--s-image-bg)" },
  SCHEDULED: { labelKey: "scheduled", color: "var(--s-sched)", bg: "var(--s-sched-bg)" },
  PUBLISHING: { labelKey: "publishing", color: "var(--s-sched)", bg: "var(--s-sched-bg)" },
  PUBLISH_FAILED: { labelKey: "failed", color: "#f43f5e", bg: "rgba(244,63,94,0.12)" },
  POSTED: { labelKey: "posted", color: "var(--s-image)", bg: "var(--s-image-bg)" },
};

const PUBLISHABLE = new Set(["CURATED", "DESIGNED", "IMAGE_GENERATED", "SCHEDULED", "PUBLISH_FAILED"]);

export function TweetPreviewModal({ tweet, project, onClose, onPublished }: TweetPreviewModalProps) {
  const t = useTranslations("preview");
  const status = STATUS_MAP[tweet.status] || STATUS_MAP.DRAFT;
  const [connected, setConnected] = useState(false);
  const [xConfigured, setXConfigured] = useState(true);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadConnection() {
      const res = await fetch("/api/x/connection");
      if (!cancelled) {
        const data = res.ok ? await res.json() : null;
        setXConfigured(Boolean(data?.configured));
        setConnected(Boolean(data?.projects?.[project.id]?.connected));
        setCheckingConnection(false);
      }
    }

    void loadConnection();
    return () => {
      cancelled = true;
    };
  }, [project.id]);

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

  async function publishNow() {
    setPublishing(true);
    const res = await fetch("/api/tweets/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tweetId: tweet.id }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(t("postedToX"));
      onPublished?.(data);
      onClose();
    } else {
      toast.error(data.error || t("publishFailed"));
    }
    setPublishing(false);
  }

  const canPublish = PUBLISHABLE.has(tweet.status) && !tweet.externalPostId;
  const connectHref = `/api/x/connect?projectId=${project.id}`;

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
            <span className="text-[13px] font-semibold" style={{ color: "var(--imp-text)" }}>{t("postPreview")}</span>
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ color: status.color, background: status.bg }}
            >
              <span className="w-[5px] h-[5px] rounded-full" style={{ background: status.color }} />
              {t(`statuses.${status.labelKey}`)}
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
                <span className="text-[13.5px]" style={{ color: "var(--imp-faint)" }}>· {tweet.status === "POSTED" ? t("state.posted") : tweet.status === "SCHEDULED" ? t("state.scheduled") : t("state.draft")}</span>
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
                  * {t("aiGenerated")}
                </span>
              </div>
            </ImageLightbox>
          )}

          {/* Schedule info */}
          {tweet.publishedAt ? (
            <div className="flex items-center gap-1.5 text-[13px]" style={{ color: "var(--imp-muted)" }}>
              <Check size={14} style={{ color: "var(--s-image)" }} />
              <span>{t("posted")}</span>
              <span className="font-semibold" style={{ color: "var(--imp-text)" }}>{formatSchedule(tweet.publishedAt)}</span>
            </div>
          ) : tweet.scheduledAt ? (
            <div className="flex items-center gap-1.5 text-[13px]" style={{ color: "var(--imp-muted)" }}>
              <Clock size={14} style={{ color: "var(--s-sched)" }} />
              <span>{t("scheduledFor")}</span>
              <span className="font-semibold" style={{ color: "var(--imp-text)" }}>{formatSchedule(tweet.scheduledAt)}</span>
            </div>
          ) : (
            <div className="text-[13px]" style={{ color: "var(--imp-faint)" }}>
              {t("draftPreview")}
            </div>
          )}
          {tweet.publishError && (
            <div className="mt-2 flex items-start gap-1.5 text-[12.5px]" style={{ color: "#f43f5e" }}>
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{tweet.publishError}</span>
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
            {t("projection")}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[12.5px] gap-1.5"
              onClick={() => { navigator.clipboard.writeText(tweet.content); toast.success(t("copied")); }}
            >
              <Copy size={13} /> {t("copy")}
            </Button>
            {canPublish && !xConfigured && (
              <Button
                size="sm"
                className="imp-btn-primary h-8 text-[12.5px] gap-1.5 rounded-[8px]"
                disabled
              >
                <X size={13} /> {t("xNotConfigured")}
              </Button>
            )}
            {canPublish && xConfigured && (
              connected ? (
                <Button
                  size="sm"
                  className="imp-btn-primary h-8 text-[12.5px] gap-1.5 rounded-[8px]"
                  onClick={publishNow}
                  disabled={publishing}
                >
                  {publishing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  {publishing ? t("publishing") : t("publishNow")}
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="imp-btn-primary h-8 text-[12.5px] gap-1.5 rounded-[8px]"
                  disabled={checkingConnection}
                  onClick={() => { window.location.href = connectHref; }}
                >
                  <X size={13} /> {t("connectX")}
                </Button>
              )
            )}
            {!canPublish && (
              <Button
                size="sm"
                className="imp-btn-primary h-8 text-[12.5px] gap-1.5 rounded-[8px]"
                onClick={onClose}
              >
                <Check size={13} /> {t("looksGood")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
