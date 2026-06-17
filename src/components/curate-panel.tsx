"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
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
  Copy,
  Upload,
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
  { status: "DRAFT", color: "--s-draft", labelKey: "columns.draft", hintKey: "columns.draftHint" },
  { status: "CURATED", color: "--s-curated", labelKey: "columns.curated", hintKey: "columns.curatedHint" },
  { status: "DESIGNED", color: "--s-designed", labelKey: "columns.designed", hintKey: "columns.designedHint" },
  { status: "IMAGE_GENERATED", color: "--s-image", labelKey: "columns.imageReady", hintKey: "columns.imageReadyHint" },
];

const LABEL_KEYS: Record<string, string> = {
  DRAFT: "columns.draft",
  CURATED: "columns.curated",
  DESIGNED: "columns.designed",
  IMAGE_GENERATED: "columns.imageReady",
};

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

const IMAGE_MODELS = [
  { id: "gpt-image-2", label: "GPT Image 2" },
  { id: "gemini-2.5-flash-image", label: "Gemini Flash" },
  { id: "dall-e-3", label: "DALL·E 3" },
];

const UPLOAD_CHUNK_SIZE = 512 * 1024;

// --- Tweet card ---
function tweetImageSrc(imageUrl: string) {
  if (imageUrl.startsWith("http") || imageUrl.startsWith("/") || imageUrl.startsWith("data:")) return imageUrl;
  return `data:image/png;base64,${imageUrl}`;
}

async function responseError(res: Response, fallback: string) {
  const data = await res.json().catch(() => null);
  if (data?.error) return data.error;
  return `${fallback} (${res.status} ${res.statusText})`;
}

function uploadId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function TweetCard({
  tweet,
  styles,
  onApprove,
  onDesign,
  onImage,
  onUploadImage,
  onDeleteImage,
  onDelete,
  onEdit,
  isProcessing,
}: {
  tweet: Tweet;
  styles: Style[];
  onApprove: () => void;
  onDesign: (styleId?: string | null) => void;
  onImage: (model?: string, feedback?: string) => void;
  onUploadImage: (file: File) => void;
  onDeleteImage: () => void;
  onDelete: () => void;
  onEdit: () => void;
  isProcessing: boolean;
}) {
  const t = useTranslations("curate");
  const tc = useTranslations("common");
  const [briefOpen, setBriefOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const len = tweet.content.length;

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(t("onlyImageFiles"));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("imageTooLarge"));
      return;
    }
    onUploadImage(file);
  }, [onUploadImage]);

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) await handleFileSelect(file);
        return;
      }
    }
  }, [handleFileSelect]);

  function copyImagePrompt() {
    if (!tweet.designBrief) return;
    try {
      const brief = JSON.parse(tweet.designBrief);
      const prompt = brief.imagePrompt || brief.concept || "";
      navigator.clipboard.writeText(prompt);
      toast.success(t("imagePromptCopied"));
    } catch {
      toast.error(t("copyPromptFailed"));
    }
  }

  return (
    <div
      ref={cardRef}
      onPaste={handlePaste}
      className="imp-card relative rounded-[13px] p-[var(--imp-card-pad)] flex flex-col gap-2.5 cursor-grab"
      style={{
        background: "var(--imp-surface)",
        border: "1px solid var(--imp-border)",
        boxShadow: "var(--imp-shadow-sm)",
      }}
    >
      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) await handleFileSelect(file);
          e.target.value = "";
        }}
      />
      {/* Busy overlay */}
      {isProcessing && (
        <div className="absolute inset-0 rounded-[13px] flex flex-col items-center justify-center gap-2 z-10"
          style={{ background: "color-mix(in srgb, var(--imp-surface) 78%, transparent)", backdropFilter: "blur(2px)" }}>
          <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: "var(--imp-accent)" }} />
          <span className="text-[12px] font-semibold" style={{ color: "var(--imp-text-2)" }}>{t("processing")}</span>
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
              <Pencil size={13} /> {t("editCopy")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="gap-2 text-red-400">
              <Trash2 size={13} /> {tc("delete")}
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
        <>
          <ImageLightbox
            src={tweetImageSrc(tweet.imageUrl)}
            alt={t("generatedAlt")}
          >
            <div className="rounded-[10px] overflow-hidden h-[120px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tweetImageSrc(tweet.imageUrl)}
                alt={t("generatedAlt")}
                className="w-full h-full object-cover"
              />
            </div>
          </ImageLightbox>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && feedback.trim()) { onImage(undefined, feedback); setFeedback(""); } }}
              placeholder={t("feedbackPlaceholder")}
              disabled={isProcessing}
              className="flex-1 h-7 rounded-md px-2 text-[12px] outline-none"
              style={{ background: "var(--imp-bg)", border: "1px solid var(--imp-border)", color: "var(--imp-text)" }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
                disabled={isProcessing}
              >
                <ImageIcon size={13} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {IMAGE_MODELS.map((m) => (
                  <DropdownMenuItem key={m.id} onClick={() => { onImage(m.id, feedback || undefined); setFeedback(""); }} className="gap-2 text-[12.5px]">
                    <ImageIcon size={12} /> {m.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-7 h-7 rounded-md flex items-center justify-center bg-transparent border-none hover:bg-black/10"
              style={{ color: "var(--imp-muted)" }}
              title={t("uploadReplacement")}
            >
              <Upload size={13} />
            </button>
            <button
              onClick={onDeleteImage}
              disabled={isProcessing}
              className="w-7 h-7 rounded-md flex items-center justify-center bg-transparent border-none hover:bg-red-500/10"
              style={{ color: "var(--imp-muted)" }}
              title={t("deleteImage")}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </>
      )}

      {/* Design brief collapsible */}
      {tweet.designBrief && !tweet.imageUrl && (
        <div className="rounded-[9px] overflow-hidden" style={{ border: "1px solid var(--s-designed-line)", background: "var(--s-designed-bg)" }}>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5">
            <button
              onClick={() => setBriefOpen(!briefOpen)}
              className="flex items-center gap-1.5 flex-1 bg-transparent border-none text-[11.5px] font-semibold p-0"
              style={{ color: "var(--s-designed)" }}
            >
              <Palette size={13} />
              <span className="flex-1 text-left">{t("designBrief")}</span>
              <span className="transition-transform" style={{ transform: briefOpen ? "rotate(180deg)" : "none" }}>▾</span>
            </button>
            <button
              onClick={copyImagePrompt}
              className="flex items-center justify-center w-6 h-6 rounded-md bg-transparent border-none hover:bg-black/10"
              style={{ color: "var(--s-designed)" }}
              title={t("copyImagePrompt")}
            >
              <Copy size={12} />
            </button>
          </div>
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
            <Check size={13} /> {t("approve")}
          </Button>
        )}
        {tweet.status === "CURATED" && (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1.5 h-7 text-[12px] px-2.5 rounded-md font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80" disabled={isProcessing}>
              <Palette size={13} /> {t("designBrief")} ▾
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {styles.length > 0 ? (
                <>
                  {styles.map((s) => (
                    <DropdownMenuItem key={s.id} onClick={() => onDesign(s.id)} className="gap-2 text-[12.5px]">
                      <Palette size={12} /> {s.name} {s.isDefault && `(${t("default")})`}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDesign(null)} className="gap-2 text-[12.5px]">
                    {t("noStyle")}
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => onDesign()} className="gap-2 text-[12.5px]">
                  <Palette size={12} /> {t("generateBrief")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {tweet.status === "DESIGNED" && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-1.5 h-7 text-[12px] px-2.5 rounded-md font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80" disabled={isProcessing}>
                <ImageIcon size={13} /> {t("generateImage")} ▾
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {IMAGE_MODELS.map((m) => (
                  <DropdownMenuItem key={m.id} onClick={() => onImage(m.id)} className="gap-2 text-[12.5px]">
                    <ImageIcon size={12} /> {m.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 h-7 text-[12px] px-2.5 rounded-md font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 border-none"
              title={t("uploadOrPaste")}
            >
              <Upload size={13} /> {t("upload")}
            </button>
          </>
        )}
        {tweet.status === "IMAGE_GENERATED" && (
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold" style={{ color: "var(--s-image)" }}>
            <CheckCircle size={14} /> {t("readyToSchedule")}
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
  const t = useTranslations("curate");
  const tc = useTranslations("common");
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
    const tweet = tweets.find((t) => t.id === tweetId);
    const prevStatus = tweet?.status;
    setTweets((prev) => prev.map((t) => (t.id === tweetId ? { ...t, status } : t)));
    const res = await fetch("/api/tweets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tweetId, status }),
    });
    if (!res.ok && prevStatus) {
      setTweets((prev) => prev.map((t) => (t.id === tweetId ? { ...t, status: prevStatus } : t)));
      toast.error(t("moveFailed") ?? "Failed to update status");
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
      toast.success(t("tweetUpdated"));
    }
  }

  async function handleDelete(tweetId: string) {
    const res = await fetch(`/api/tweets?tweetId=${tweetId}`, { method: "DELETE" });
    if (res.ok) {
      setTweets((prev) => prev.filter((t) => t.id !== tweetId));
      toast.success(t("tweetDeleted"));
    }
  }

  async function handleDesign(tweetId: string, styleId?: string | null) {
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
      toast.success(t("briefGenerated"));
    } catch {
      toast.error(t("briefFailed"));
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(tweetId);
        return next;
      });
    }
  }

  async function handleImage(tweetId: string, model?: string, feedback?: string) {
    setProcessingIds((prev) => new Set(prev).add(tweetId));
    try {
      const res = await fetch("/api/tweets/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tweetId, model, feedback }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed");
      }
      const updated = await res.json();
      setTweets((prev) => prev.map((t) => (t.id === tweetId ? updated : t)));
      toast.success(t("imageGenerated"));
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

  async function handleUploadImage(tweetId: string, file: File) {
    setProcessingIds((prev) => new Set(prev).add(tweetId));
    try {
      const totalChunks = Math.ceil(file.size / UPLOAD_CHUNK_SIZE);
      const id = uploadId();
      let updated: Tweet | null = null;

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
        const start = chunkIndex * UPLOAD_CHUNK_SIZE;
        const chunk = file.slice(start, start + UPLOAD_CHUNK_SIZE, file.type);
        const formData = new FormData();
        formData.set("tweetId", tweetId);
        formData.set("image", chunk, file.name);
        formData.set("uploadId", id);
        formData.set("chunkIndex", String(chunkIndex));
        formData.set("totalChunks", String(totalChunks));
        formData.set("fileSize", String(file.size));

        const res = await fetch("/api/tweets/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error(await responseError(res, "Failed to upload image"));

        const data = await res.json();
        if (data?.complete) updated = data.tweet;
      }

      if (!updated) throw new Error("Image upload did not complete.");
      setTweets((prev) => prev.map((t) => (t.id === tweetId ? updated : t)));
      toast.success(t("imageUploaded"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload image";
      toast.error(message);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(tweetId);
        return next;
      });
    }
  }

  async function handleDeleteImage(tweetId: string) {
    setProcessingIds((prev) => new Set(prev).add(tweetId));
    try {
      const res = await fetch("/api/tweets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tweetId, imageUrl: null, imagePrompt: null, status: "DESIGNED" }),
      });
      if (!res.ok) throw new Error(await responseError(res, "Failed to delete image"));
      const updated = await res.json();
      setTweets((prev) => prev.map((t) => (t.id === tweetId ? updated : t)));
      toast.success(t("imageDeleted"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete image";
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

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const tweetId = active.id as string;
    const newStatus = over.id as string;
    const tweet = tweets.find((t) => t.id === tweetId);
    if (!tweet || tweet.status === newStatus) return;
    const prevStatus = tweet.status;
    setTweets((prev) => prev.map((t) => (t.id === tweetId ? { ...t, status: newStatus } : t)));
    const res = await fetch("/api/tweets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tweetId, status: newStatus }),
    });
    if (res.ok) {
      toast.info(t("movedTo", { label: t(LABEL_KEYS[newStatus] || "") }));
    } else {
      setTweets((prev) => prev.map((t) => (t.id === tweetId ? { ...t, status: prevStatus } : t)));
      toast.error(t("moveFailed") ?? "Failed to move tweet");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: "var(--imp-muted)" }}>
        {t("loading")}
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
          <h3 className="text-base font-semibold mb-1" style={{ color: "var(--imp-text)" }}>{t("emptyTitle")}</h3>
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--imp-muted)" }}>
            {t("emptyDesc")}
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
            {t("title")}
          </h2>
          <p className="text-[13.5px] m-0" style={{ color: "var(--imp-muted)" }}>
            {t("subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[12.5px]" style={{ color: "var(--imp-text-2)" }}>
            {t("readyCount", { count: readyCount })}
          </div>
          <Button onClick={onComplete} className="imp-btn-primary h-9 px-3.5 text-[13px] rounded-[9px] gap-1.5">
            <Calendar size={14} /> {t("goToSchedule")}
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
                  <span className="text-[13px] font-semibold" style={{ color: "var(--imp-text)" }}>{t(col.labelKey)}</span>
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
                      {t(col.hintKey)}
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
                                <Check size={13} /> {t("save")}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 text-[12px]">
                                {tc("cancel")}
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
                            onImage={(model, feedback) => handleImage(tweet.id, model, feedback)}
                            onUploadImage={(dataUrl) => handleUploadImage(tweet.id, dataUrl)}
                            onDeleteImage={() => handleDeleteImage(tweet.id)}
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
