"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
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
import {
  Check,
  Palette,
  ImageIcon,
  Trash2,
  GripVertical,
  Pencil,
  Calendar,
  MoreHorizontal,
  CheckCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageLightbox } from "@/components/ui/image-lightbox";

interface Project {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string | null;
}

interface Style {
  id: string;
  name: string;
  isDefault: boolean;
}

interface Tweet {
  id: string;
  content: string;
  status: string;
  designBrief: string | null;
  imageUrl: string | null;
  imagePrompt: string | null;
}

interface CuratePanelProps {
  project: Project;
  onComplete: () => void;
}

const COLUMNS = [
  { status: "DRAFT", label: "Draft", color: "--s-draft", hint: "Fresh from AI — review & approve" },
  { status: "CURATED", label: "Curated", color: "--s-curated", hint: "Approved copy — ready to design" },
  { status: "DESIGNED", label: "Designed", color: "--s-designed", hint: "Has a visual brief" },
  { status: "IMAGE_GENERATED", label: "Image ready", color: "--s-image", hint: "Art generated — ready to schedule" },
];

// --- Draggable card wrapper ---
function DraggableCard({ tweet, children }: { tweet: Tweet; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: tweet.id,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

// --- Droppable column ---
function DroppableColumn({ status, children }: { status: string; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className="flex-1 min-w-[var(--imp-col-w)] max-w-[420px] flex flex-col min-h-0 rounded-2xl p-1.5 transition-all"
      style={{
        background: isOver ? "var(--imp-accent-soft)" : "transparent",
        outline: isOver ? "1.5px dashed var(--imp-accent-line)" : "1.5px solid transparent",
      }}
    >
      {children}
    </div>
  );
}

// --- Tweet card ---
function TweetCard({
  tweet,
  styles,
  onApprove,
  onDesign,
  onImage,
  onDelete,
  onEdit,
  isProcessing,
}: {
  tweet: Tweet;
  styles: Style[];
  onApprove: () => void;
  onDesign: (styleId?: string) => void;
  onImage: () => void;
  onDelete: () => void;
  onEdit: () => void;
  isProcessing: boolean;
}) {
  const [briefOpen, setBriefOpen] = useState(false);
  const len = tweet.content.length;

  return (
    <div
      className="imp-card relative rounded-[13px] p-[var(--imp-card-pad)] flex flex-col gap-2.5 cursor-grab"
      style={{
        background: "var(--imp-surface)",
        border: "1px solid var(--imp-border)",
        boxShadow: "var(--imp-shadow-sm)",
      }}
    >
      {/* Busy overlay */}
      {isProcessing && (
        <div className="absolute inset-0 rounded-[13px] flex flex-col items-center justify-center gap-2 z-10"
          style={{ background: "color-mix(in srgb, var(--imp-surface) 78%, transparent)", backdropFilter: "blur(2px)" }}>
          <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: "var(--imp-accent)" }} />
          <span className="text-[12px] font-semibold" style={{ color: "var(--imp-text-2)" }}>Processing…</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <GripVertical size={14} style={{ color: "var(--imp-faint)", flexShrink: 0 }} />
        <div className="flex-1" />
        <DropdownMenu>
          <DropdownMenuTrigger className="imp-icon-btn w-6 h-6 flex items-center justify-center" style={{ color: "var(--imp-muted)" }}>
            <MoreHorizontal size={14} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={onEdit} className="gap-2">
              <Pencil size={13} /> Edit copy
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="gap-2 text-red-400">
              <Trash2 size={13} /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Body */}
      <p className="m-0 text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--imp-text)" }}>
        {tweet.content}
      </p>

      {/* Image */}
      {tweet.imageUrl && (
        <ImageLightbox
          src={tweet.imageUrl.startsWith("http") || tweet.imageUrl.startsWith("/") ? tweet.imageUrl : `data:image/png;base64,${tweet.imageUrl}`}
          alt="Generated"
        >
          <div className="rounded-[10px] overflow-hidden h-[120px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tweet.imageUrl.startsWith("http") || tweet.imageUrl.startsWith("/") ? tweet.imageUrl : `data:image/png;base64,${tweet.imageUrl}`}
              alt="Generated"
              className="w-full h-full object-cover"
            />
          </div>
        </ImageLightbox>
      )}

      {/* Design brief collapsible */}
      {tweet.designBrief && !tweet.imageUrl && (
        <div className="rounded-[9px] overflow-hidden" style={{ border: "1px solid var(--s-designed-line)", background: "var(--s-designed-bg)" }}>
          <button
            onClick={() => setBriefOpen(!briefOpen)}
            className="flex items-center gap-1.5 w-full px-2.5 py-1.5 bg-transparent border-none text-[11.5px] font-semibold"
            style={{ color: "var(--s-designed)" }}
          >
            <Palette size={13} />
            <span className="flex-1 text-left">Design brief</span>
            <span className="transition-transform" style={{ transform: briefOpen ? "rotate(180deg)" : "none" }}>▾</span>
          </button>
          {briefOpen && (
            <p className="m-0 px-2.5 pb-2.5 text-[11.5px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--imp-text-2)" }}>
              {tweet.designBrief}
            </p>
          )}
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
        {tweet.status === "DRAFT" && (
          <Button size="sm" onClick={onApprove} className="h-7 text-[12px] gap-1.5 px-2.5" style={{ background: "var(--imp-accent-soft)", color: "var(--imp-accent)", border: "1px solid var(--imp-accent-line)" }}>
            <Check size={13} /> Approve
          </Button>
        )}
        {tweet.status === "CURATED" && (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1.5 h-7 text-[12px] px-2.5 rounded-md font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80" disabled={isProcessing}>
              <Palette size={13} /> Design brief ▾
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {styles.length > 0 ? (
                <>
                  {styles.map((s) => (
                    <DropdownMenuItem key={s.id} onClick={() => onDesign(s.id)} className="gap-2 text-[12.5px]">
                      <Palette size={12} /> {s.name} {s.isDefault && "(default)"}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDesign()} className="gap-2 text-[12.5px]">
                    No style
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => onDesign()} className="gap-2 text-[12.5px]">
                  <Palette size={12} /> Generate brief
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {tweet.status === "DESIGNED" && (
          <Button size="sm" variant="secondary" onClick={onImage} disabled={isProcessing} className="h-7 text-[12px] gap-1.5 px-2.5">
            <ImageIcon size={13} /> Generate image
          </Button>
        )}
        {tweet.status === "IMAGE_GENERATED" && (
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold" style={{ color: "var(--s-image)" }}>
            <CheckCircle size={14} /> Ready to schedule
          </span>
        )}
        <div className="flex-1" />
        <span className="font-mono text-[10.5px]" style={{ color: len > 280 ? "#f87171" : "var(--imp-faint)" }}>
          {len}
        </span>
      </div>
    </div>
  );
}

export function CuratePanel({ project, onComplete }: CuratePanelProps) {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [processingIds, setProcessingIds] = useState<Set<string>>(() => new Set());
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    let cancelled = false;

    async function loadPanelData() {
      const [tweetsRes, stylesRes] = await Promise.all([
        fetch(`/api/tweets?projectId=${project.id}`),
        fetch(`/api/styles?projectId=${project.id}`),
      ]);
      if (cancelled) return;
      if (tweetsRes.ok) setTweets(await tweetsRes.json());
      if (stylesRes.ok) setStyles(await stylesRes.json());
      setLoading(false);
    }

    void loadPanelData();
    return () => {
      cancelled = true;
    };
  }, [project.id]);

  async function updateStatus(tweetId: string, status: string) {
    const res = await fetch("/api/tweets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tweetId, status }),
    });
    if (res.ok) {
      setTweets((prev) => prev.map((t) => (t.id === tweetId ? { ...t, status } : t)));
    }
  }

  async function handleSave(tweetId: string) {
    const res = await fetch("/api/tweets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tweetId, content: editContent, status: "CURATED" }),
    });
    if (res.ok) {
      setTweets((prev) => prev.map((t) => (t.id === tweetId ? { ...t, content: editContent, status: "CURATED" } : t)));
      setEditingId(null);
      toast.success("Tweet updated");
    }
  }

  async function handleDelete(tweetId: string) {
    const res = await fetch(`/api/tweets?tweetId=${tweetId}`, { method: "DELETE" });
    if (res.ok) {
      setTweets((prev) => prev.filter((t) => t.id !== tweetId));
      toast.success("Tweet deleted");
    }
  }

  async function handleDesign(tweetId: string, styleId?: string) {
    setProcessingIds((prev) => new Set(prev).add(tweetId));
    try {
      const res = await fetch("/api/tweets/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tweetId, styleId }),
      });
      if (!res.ok) throw new Error("Failed");
      const updated = await res.json();
      setTweets((prev) => prev.map((t) => (t.id === tweetId ? updated : t)));
      toast.success("Design brief generated");
    } catch {
      toast.error("Failed to generate design brief");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(tweetId);
        return next;
      });
    }
  }

  async function handleImage(tweetId: string) {
    setProcessingIds((prev) => new Set(prev).add(tweetId));
    try {
      const res = await fetch("/api/tweets/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tweetId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed");
      }
      const updated = await res.json();
      setTweets((prev) => prev.map((t) => (t.id === tweetId ? updated : t)));
      toast.success("Image generated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate image";
      toast.error(message);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(tweetId);
        return next;
      });
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const tweetId = active.id as string;
    const newStatus = over.id as string;
    const tweet = tweets.find((t) => t.id === tweetId);
    if (!tweet || tweet.status === newStatus) return;
    updateStatus(tweetId, newStatus);
    toast.info(`Moved to ${COLUMNS.find((c) => c.status === newStatus)?.label}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: "var(--imp-muted)" }}>
        Loading tweets...
      </div>
    );
  }

  const pool = tweets.filter((t) => ["DRAFT", "CURATED", "DESIGNED", "IMAGE_GENERATED"].includes(t.status));
  const readyCount = pool.filter((t) => t.status === "IMAGE_GENERATED" || t.status === "CURATED" || t.status === "DESIGNED").length;
  const activeTweet = tweets.find((t) => t.id === activeId);

  if (pool.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-[380px]">
          <div
            className="w-[60px] h-[60px] mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--imp-surface-2)", border: "1px solid var(--imp-border-2)", color: "var(--imp-muted)" }}
          >
            <Palette size={26} />
          </div>
          <h3 className="text-base font-semibold mb-1" style={{ color: "var(--imp-text)" }}>Nothing to curate yet</h3>
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--imp-muted)" }}>
            Head to the Generate stage to create a batch of drafts. They&apos;ll land here as cards you can move through each stage.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-end justify-between px-7 pt-5 pb-3 gap-4 flex-wrap">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight mb-1" style={{ color: "var(--imp-text)" }}>
            Curate & design
          </h2>
          <p className="text-[13.5px] m-0" style={{ color: "var(--imp-muted)" }}>
            Drag cards across stages, or use the actions to approve, brief, and render images.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[12.5px]" style={{ color: "var(--imp-text-2)" }}>
            <span className="font-mono font-semibold" style={{ color: "var(--imp-text)" }}>{readyCount}</span>
            ready to schedule
          </div>
          <Button onClick={onComplete} className="imp-btn-primary h-9 px-3.5 text-[13px] rounded-[9px] gap-1.5">
            <Calendar size={14} /> Go to Schedule
          </Button>
        </div>
      </div>

      {/* Kanban */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 min-h-0 flex gap-2 px-5 pb-2 overflow-x-auto">
          {COLUMNS.map((col) => {
            const colTweets = pool.filter((t) => t.status === col.status);
            return (
              <DroppableColumn key={col.status} status={col.status}>
                {/* Column header */}
                <div className="flex items-center gap-2 px-2 py-2 pb-2.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: `var(${col.color})`, boxShadow: `0 0 8px var(${col.color})` }} />
                  <span className="text-[13px] font-semibold" style={{ color: "var(--imp-text)" }}>{col.label}</span>
                  <span
                    className="font-mono text-[11.5px] rounded-full px-1.5 min-w-[22px] text-center"
                    style={{ color: "var(--imp-muted)", background: "var(--imp-surface-2)", border: "1px solid var(--imp-border)" }}
                  >
                    {colTweets.length}
                  </span>
                </div>
                {/* Cards */}
                <div className="flex flex-col gap-[var(--imp-gap)] overflow-y-auto overflow-x-hidden px-1.5 pb-3.5 flex-1 min-h-0">
                  {colTweets.length === 0 ? (
                    <div
                      className="rounded-xl p-5 text-center text-[12px] leading-relaxed"
                      style={{ border: "1.5px dashed var(--imp-border-2)", color: "var(--imp-faint)" }}
                    >
                      {col.hint}
                    </div>
                  ) : (
                    colTweets.map((tweet) => (
                      <DraggableCard key={tweet.id} tweet={tweet}>
                        {editingId === tweet.id ? (
                          <div
                            className="rounded-[13px] p-[var(--imp-card-pad)] flex flex-col gap-2"
                            style={{ background: "var(--imp-surface)", border: "1px solid var(--imp-border)" }}
                          >
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              rows={4}
                              autoFocus
                              className="w-full rounded-lg px-2.5 py-2 text-[13px] leading-relaxed outline-none resize-none"
                              style={{ background: "var(--imp-bg)", border: "1px solid var(--imp-accent-line)", color: "var(--imp-text)" }}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSave(tweet.id)} className="h-7 text-[12px] gap-1">
                                <Check size={13} /> Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 text-[12px]">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <TweetCard
                            tweet={tweet}
                            styles={styles}
                            isProcessing={processingIds.has(tweet.id)}
                            onApprove={() => updateStatus(tweet.id, "CURATED")}
                            onDesign={(styleId) => handleDesign(tweet.id, styleId)}
                            onImage={() => handleImage(tweet.id)}
                            onDelete={() => handleDelete(tweet.id)}
                            onEdit={() => { setEditingId(tweet.id); setEditContent(tweet.content); }}
                          />
                        )}
                      </DraggableCard>
                    ))
                  )}
                </div>
              </DroppableColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeTweet ? (
            <div
              className="rounded-[13px] p-3 max-w-[300px] shadow-lg"
              style={{ background: "var(--imp-surface)", border: "1px solid var(--imp-accent-line)" }}
            >
              <p className="m-0 text-[12px] leading-relaxed line-clamp-3" style={{ color: "var(--imp-text)" }}>
                {activeTweet.content}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
