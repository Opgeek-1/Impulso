"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Inbox,
  Clock,
  CheckCircle,
  GripVertical,
  X,
  Eye,
  CalendarClock,
} from "lucide-react";
import { TweetPreviewModal } from "@/components/tweet-preview-modal";
import { SchedulePickerDialog } from "@/components/schedule-picker-dialog";

interface Project {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string | null;
}

interface Tweet {
  id: string;
  content: string;
  status: string;
  imageUrl: string | null;
  scheduledAt: string | null;
  externalPostId?: string | null;
  publishedAt?: string | null;
  publishError?: string | null;
}

interface SchedulePanelProps {
  project: Project;
}

const PREF_HOURS = [9, 12, 15, 18, 11, 14, 17, 20];

function nextSlot(dayDate: Date, taken: Date[]): Date {
  const used = new Set(taken.map((d) => d.getHours()));
  for (const hr of PREF_HOURS) {
    if (!used.has(hr)) {
      const x = new Date(dayDate);
      x.setHours(hr, 0, 0, 0);
      return x;
    }
  }
  const x = new Date(dayDate);
  x.setHours(9 + taken.length, 0, 0, 0);
  return x;
}

function fmtTime(d: Date): string {
  let hh = d.getHours();
  const m = d.getMinutes();
  const ap = hh >= 12 ? "PM" : "AM";
  hh = hh % 12 || 12;
  return hh + (m ? ":" + String(m).padStart(2, "0") : "") + " " + ap;
}

// --- Draggable tray card ---
function TrayCard({ tweet, onSchedule }: { tweet: Tweet; onSchedule: () => void }) {
  const t = useTranslations("schedule");
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: tweet.id });
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 };

  return (
    <div
      ref={setNodeRef}
      className="imp-card rounded-xl p-3 flex gap-2.5 items-start group"
      style={{ ...style, background: "var(--imp-surface)", border: "1px solid var(--imp-border)", boxShadow: "var(--imp-shadow-sm)" }}
    >
      <div
        {...attributes}
        {...listeners}
        className="w-[42px] h-[42px] rounded-lg flex items-center justify-center shrink-0 cursor-grab"
        style={{ background: "var(--imp-surface-3)", border: "1px solid var(--imp-border)", color: "var(--imp-faint)" }}
      >
        <GripVertical size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="m-0 mb-1.5 text-[12px] leading-snug line-clamp-2" style={{ color: "var(--imp-text-2)" }}>
          {tweet.content}
        </p>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full"
            style={{ background: "var(--s-image-bg)", color: "var(--s-image)" }}
          >
            <CheckCircle size={10} />
            {tweet.status.toLowerCase().replace("_", " ")}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onSchedule(); }}
            className="imp-icon-btn inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full transition-colors hover:brightness-95"
            style={{ background: "var(--imp-accent-soft)", color: "var(--imp-accent)", border: "1px solid var(--imp-accent-line)" }}
            title={t("scheduleWithDateTime")}
          >
            <CalendarClock size={11} />
            {t("scheduleButton")}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Draggable slot card (already scheduled) ---
function SlotCard({ tweet, onUnschedule, onPreview, onReschedule }: { tweet: Tweet; onUnschedule: () => void; onPreview: () => void; onReschedule: () => void }) {
  const t = useTranslations("schedule");
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: tweet.id });
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 };
  const date = tweet.scheduledAt ? new Date(tweet.scheduledAt) : null;
  const posted = tweet.status === "POSTED";
  const failed = tweet.status === "PUBLISH_FAILED";
  const publishing = tweet.status === "PUBLISHING";

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, background: "var(--imp-surface)", border: "1px solid var(--imp-border-2)", borderLeft: "2.5px solid var(--s-sched)", boxShadow: "var(--imp-shadow-sm)" }}
      {...attributes}
      {...listeners}
      className="imp-card relative rounded-[10px] p-2.5 flex flex-col gap-1.5 cursor-grab group"
    >
      <div className="flex items-center justify-between gap-1.5">
        {date && (
          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold" style={{ color: failed ? "#f43f5e" : posted ? "var(--s-image)" : "var(--s-sched)" }}>
            <Clock size={11} />
            {posted ? t("status.posted") : failed ? t("status.failed") : publishing ? t("status.publishing") : fmtTime(date)}
          </span>
        )}
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onPreview(); }}
            className="imp-icon-btn w-5 h-5 flex items-center justify-center"
            style={{ color: "var(--imp-muted)" }}
            title={t("preview")}
          >
            <Eye size={12} />
          </button>
          {!posted && !publishing && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onReschedule(); }}
                className="imp-icon-btn w-5 h-5 flex items-center justify-center"
                style={{ color: "var(--imp-muted)" }}
                title={t("reschedule")}
              >
                <CalendarClock size={12} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onUnschedule(); }}
                className="imp-icon-btn w-5 h-5 flex items-center justify-center"
                style={{ color: "var(--imp-muted)" }}
                title={t("unschedule")}
              >
                <X size={12} />
              </button>
            </>
          )}
        </div>
      </div>
      <p className="m-0 text-[11.5px] leading-snug line-clamp-3" style={{ color: "var(--imp-text-2)" }}>
        {tweet.content}
      </p>
    </div>
  );
}

// --- Droppable day column ---
function DayColumn({ dayId, date, isToday, tweets, onUnschedule, onPreview, onReschedule }: {
  dayId: string;
  date: Date;
  isToday: boolean;
  tweets: Tweet[];
  onUnschedule: (id: string) => void;
  onPreview: (tweet: Tweet) => void;
  onReschedule: (tweet: Tweet) => void;
}) {
  const t = useTranslations("schedule");
  const { isOver, setNodeRef } = useDroppable({ id: dayId });
  const sorted = [...tweets].sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());
  const DAYNAMES = [t("dayNames.mon"), t("dayNames.tue"), t("dayNames.wed"), t("dayNames.thu"), t("dayNames.fri"), t("dayNames.sat"), t("dayNames.sun")];
  const dayIdx = (date.getDay() + 6) % 7;

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col min-w-0 transition-colors"
      style={{
        borderRight: "1px solid var(--imp-border)",
        background: isOver ? "var(--imp-accent-soft)" : isToday ? "color-mix(in srgb, var(--imp-accent-soft) 40%, transparent)" : "transparent",
      }}
    >
      {/* Header */}
      <div
        className="px-3 py-2.5 flex items-baseline justify-between sticky top-0 z-[2]"
        style={{ borderBottom: "1px solid var(--imp-border)", background: "color-mix(in srgb, var(--imp-surface) 60%, transparent)", backdropFilter: "blur(6px)" }}
      >
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-[12px] font-semibold uppercase tracking-wider"
            style={{ color: isToday ? "var(--imp-accent)" : "var(--imp-text-2)" }}
          >
            {DAYNAMES[dayIdx]}
          </span>
          <span
            className="font-mono text-[15px] font-bold"
            style={{ color: isToday ? "var(--imp-accent)" : "var(--imp-text)" }}
          >
            {date.getDate()}
          </span>
        </div>
        {tweets.length > 0 && (
          <span className="font-mono text-[10.5px]" style={{ color: "var(--imp-muted)" }}>{tweets.length}</span>
        )}
      </div>
      {/* Body */}
      <div className="flex-1 min-h-[130px] p-2 flex flex-col gap-2 overflow-y-auto">
        {sorted.map((t) => (
          <SlotCard key={t.id} tweet={t} onUnschedule={() => onUnschedule(t.id)} onPreview={() => onPreview(t)} onReschedule={() => onReschedule(t)} />
        ))}
        {isOver && (
          <div
            className="rounded-[9px] p-3.5 text-center text-[11px] font-semibold"
            style={{ border: "1.5px dashed var(--imp-accent-line)", color: "var(--imp-accent)" }}
          >
            {t("dropToSchedule")}
          </div>
        )}
      </div>
    </div>
  );
}

export function SchedulePanel({ project }: SchedulePanelProps) {
  const t = useTranslations("schedule");
  const [allTweets, setAllTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [previewTweet, setPreviewTweet] = useState<Tweet | null>(null);
  const [schedulingTweet, setSchedulingTweet] = useState<Tweet | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    let cancelled = false;

    async function loadTweets() {
      const res = await fetch(`/api/tweets?projectId=${project.id}`);
      if (cancelled) return;
      if (res.ok) setAllTweets(await res.json());
      setLoading(false);
    }

    void loadTweets();
    return () => {
      cancelled = true;
    };
  }, [project.id]);

  const scheduled = allTweets.filter((t) => t.scheduledAt && ["SCHEDULED", "PUBLISHING", "PUBLISH_FAILED", "POSTED"].includes(t.status));
  const tray = allTweets.filter((t) => !t.scheduledAt && ["CURATED", "DESIGNED", "IMAGE_GENERATED", "PUBLISH_FAILED"].includes(t.status) && !t.externalPostId);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  async function scheduleToDay(tweetId: string, dayDate: Date) {
    const taken = scheduled
      .filter((x) => x.id !== tweetId && x.scheduledAt && isSameDay(new Date(x.scheduledAt), dayDate))
      .map((x) => new Date(x.scheduledAt!));
    const when = nextSlot(dayDate, taken);
    const tweet = allTweets.find((t) => t.id === tweetId);
    const prevState = tweet ? { scheduledAt: tweet.scheduledAt, status: tweet.status } : null;

    setAllTweets((prev) => prev.map((tw) => tw.id === tweetId ? { ...tw, scheduledAt: when.toISOString(), status: "SCHEDULED" } : tw));

    const res = await fetch("/api/tweets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tweetId, scheduledAt: when.toISOString(), status: "SCHEDULED" }),
    });
    if (res.ok) {
      const DAYNAMES = [t("dayNames.mon"), t("dayNames.tue"), t("dayNames.wed"), t("dayNames.thu"), t("dayNames.fri"), t("dayNames.sat"), t("dayNames.sun")];
      toast.success(t("scheduledFor", { day: DAYNAMES[(dayDate.getDay() + 6) % 7], time: fmtTime(when) }));
    } else {
      if (prevState) {
        setAllTweets((prev) => prev.map((tw) => tw.id === tweetId ? { ...tw, ...prevState } : tw));
      }
      toast.error(t("scheduleFailed") ?? "Failed to schedule tweet");
    }
  }

  async function scheduleToDateTime(tweetId: string, when: Date) {
    const tweet = allTweets.find((t) => t.id === tweetId);
    const prevState = tweet ? { scheduledAt: tweet.scheduledAt, status: tweet.status } : null;

    setAllTweets((prev) => prev.map((tw) => tw.id === tweetId ? { ...tw, scheduledAt: when.toISOString(), status: "SCHEDULED" } : tw));

    const res = await fetch("/api/tweets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tweetId, scheduledAt: when.toISOString(), status: "SCHEDULED" }),
    });
    if (res.ok) {
      toast.success(t("scheduledFor", { day: format(when, "EEE, MMM d"), time: fmtTime(when) }));
    } else {
      if (prevState) {
        setAllTweets((prev) => prev.map((tw) => tw.id === tweetId ? { ...tw, ...prevState } : tw));
      }
      toast.error(t("scheduleFailed") ?? "Failed to schedule tweet");
    }
  }

  async function unschedule(tweetId: string) {
    const tweet = allTweets.find((t) => t.id === tweetId);
    if (!tweet || tweet.status === "POSTED" || tweet.status === "PUBLISHING") return;
    const prevStatus = tweet?.imageUrl ? "IMAGE_GENERATED" : "CURATED";
    const prevState = { scheduledAt: tweet.scheduledAt, status: tweet.status };

    setAllTweets((prev) => prev.map((tw) => tw.id === tweetId ? { ...tw, scheduledAt: null, status: prevStatus } : tw));

    const res = await fetch("/api/tweets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tweetId, scheduledAt: null, status: prevStatus }),
    });
    if (res.ok) {
      toast.info(t("movedBack"));
    } else {
      setAllTweets((prev) => prev.map((tw) => tw.id === tweetId ? { ...tw, ...prevState } : tw));
      toast.error(t("unscheduleFailed") ?? "Failed to unschedule tweet");
    }
  }

  function handleDragStart(event: DragStartEvent) { setActiveId(event.active.id as string); }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const tweetId = active.id as string;
    const overId = over.id as string;
    if (overId.startsWith("day-")) {
      const dayIndex = parseInt(overId.replace("day-", ""));
      scheduleToDay(tweetId, days[dayIndex]);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64" style={{ color: "var(--imp-muted)" }}>{t("loading")}</div>;
  }

  const rangeLabel = `${format(weekStart, "MMM d")} – ${format(days[6], "MMM d")}`;
  const isThisWeek = isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 1 }));

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-end justify-between px-7 pt-5 pb-4 gap-4 flex-wrap">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight mb-1" style={{ color: "var(--imp-text)" }}>
            {t("title")}
          </h2>
          <p className="text-[13.5px] m-0" style={{ color: "var(--imp-muted)" }}>
            {t("subtitle", { handle: project.handle })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart((d) => addDays(d, -7))}
            className="imp-icon-btn w-8 h-8 flex items-center justify-center"
            style={{ color: "var(--imp-text-2)", border: "1px solid var(--imp-border-2)" }}
          >
            <ChevronLeft size={16} />
          </button>
          <div className="text-center min-w-[148px]">
            <div className="text-[13.5px] font-bold" style={{ color: "var(--imp-text)" }}>{rangeLabel}</div>
            <div className="text-[11px]" style={{ color: "var(--imp-muted)" }}>{isThisWeek ? t("thisWeek") : weekStart.getFullYear()}</div>
          </div>
          <button
            onClick={() => setWeekStart((d) => addDays(d, 7))}
            className="imp-icon-btn w-8 h-8 flex items-center justify-center"
            style={{ color: "var(--imp-text-2)", border: "1px solid var(--imp-border-2)" }}
          >
            <ChevronRight size={16} />
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
          >
            {t("today")}
          </Button>
        </div>
      </div>

      {/* Body: tray + calendar */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 min-h-0 flex gap-0 px-5 pb-4">
          {/* Tray */}
          <div className="w-[282px] shrink-0 flex flex-col min-h-0 mr-3.5">
            <div className="flex items-center gap-2 px-1 pb-3">
              <Inbox size={16} style={{ color: "var(--imp-muted)" }} />
              <span className="text-[13px] font-bold" style={{ color: "var(--imp-text)" }}>{t("readyToSchedule")}</span>
              <span
                className="font-mono text-[11.5px] rounded-full px-1.5"
                style={{ color: "var(--imp-muted)", background: "var(--imp-surface-2)", border: "1px solid var(--imp-border)" }}
              >
                {tray.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1 pb-2.5">
              {tray.length === 0 ? (
                <div
                  className="rounded-xl p-6 text-center text-[12px] leading-relaxed"
                  style={{ border: "1.5px dashed var(--imp-border-2)", color: "var(--imp-faint)" }}
                >
                  <CheckCircle size={22} style={{ color: "var(--s-image)", marginBottom: 8 }} className="mx-auto" />
                  {t("emptyTray")}
                </div>
              ) : (
                tray.map((t) => <TrayCard key={t.id} tweet={t} onSchedule={() => setSchedulingTweet(t)} />)
              )}
            </div>
          </div>

          {/* Calendar */}
          <div
            className="flex-1 min-w-0 rounded-2xl overflow-hidden flex flex-col"
            style={{ border: "1px solid var(--imp-border)", background: "color-mix(in srgb, var(--imp-surface) 45%, transparent)" }}
          >
            <div className="flex-1 grid grid-cols-7 overflow-auto min-h-0" style={{ minWidth: "924px" }}>
              {days.map((d, i) => (
                <DayColumn
                  key={i}
                  dayId={`day-${i}`}
                  date={d}
                  isToday={isSameDay(d, today)}
                  tweets={scheduled.filter((t) => t.scheduledAt && isSameDay(new Date(t.scheduledAt), d))}
                  onUnschedule={unschedule}
                  onPreview={setPreviewTweet}
                  onReschedule={setSchedulingTweet}
                />
              ))}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeId ? (
            <div
              className="rounded-xl p-3 max-w-[260px] shadow-lg"
              style={{ background: "var(--imp-surface)", border: "1px solid var(--imp-accent-line)" }}
            >
              <p className="m-0 text-[12px] leading-relaxed line-clamp-2" style={{ color: "var(--imp-text)" }}>
                {allTweets.find((t) => t.id === activeId)?.content}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {previewTweet && (
        <TweetPreviewModal
          tweet={previewTweet}
          project={project}
          onClose={() => setPreviewTweet(null)}
          onPublished={(updated) => {
            setAllTweets((prev) => prev.map((t) => t.id === updated.id ? { ...t, ...updated } : t));
          }}
        />
      )}

      <SchedulePickerDialog
        open={!!schedulingTweet}
        onOpenChange={(open) => { if (!open) setSchedulingTweet(null); }}
        onConfirm={(date) => {
          if (schedulingTweet) scheduleToDateTime(schedulingTweet.id, date);
        }}
        tweetContent={schedulingTweet?.content ?? ""}
        initialDate={schedulingTweet?.scheduledAt ? new Date(schedulingTweet.scheduledAt) : undefined}
      />
    </div>
  );
}
