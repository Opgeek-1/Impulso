"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { TopNav } from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  Image as ImageIcon,
  X,
  SlidersHorizontal,
  Pencil,
  Trash2,
  Sun,
  Moon,
  Check,
  Plus,
  FileText,
  Globe,
  Loader2,
  Lock,
  Tag,
} from "lucide-react";
import { BloomAvatar } from "@/components/ui/bloom-avatar";
import { VERSION_LOG } from "@/lib/version-log";

/* --- Types --- */
interface Project {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  brief?: string | null;
  avatarUrl?: string | null;
  brandLogoUrl?: string | null;
  brandColors?: string | null;
  brandAssetsNote?: string | null;
  _count: { tweets: number; styles: number };
}

interface Style {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
}

interface SettingsPageProps {
  projects: Project[];
  user: { id?: string; name?: string | null; email?: string | null };
}

/* --- Constants --- */
const NAV_ITEMS = [
  { id: "brief", label: "Account brief", icon: FileText },
  { id: "styles", label: "Brand kit", icon: ImageIcon },
  { id: "accounts", label: "X accounts", icon: X },
  { id: "security", label: "Security", icon: Lock },
  { id: "appearance", label: "Appearance", icon: SlidersHorizontal },
  { id: "version", label: "Version", icon: Tag },
];

const ACCENTS = [
  { key: "tomo", hex: "#FE3C9C", label: "Pink" },
  { key: "sky", hex: "#0ea5e9", label: "Sky" },
  { key: "indigo", hex: "#6366f1", label: "Indigo" },
  { key: "violet", hex: "#a855f7", label: "Violet" },
];


/* --- Account Brief Panel --- */
function AccountBriefPanel({ project, projects, onSwitchProject, onUpdate }: { project: Project; projects: Project[]; onSwitchProject: (p: Project) => void; onUpdate: (p: Project) => void }) {
  const t = useTranslations("settings.brief");
  const [brief, setBrief] = useState(project.brief || "");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id, brief }),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdate({ ...project, brief: updated.brief });
      toast.success(t("saved"));
    } else {
      toast.error(t("saveFailed"));
    }
    setSaving(false);
  }

  async function handleFetchUrl() {
    if (!url.trim()) return;
    setFetching(true);
    try {
      const res = await fetch("/api/projects/fetch-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        const data = await res.json();
        setBrief((prev) => prev ? `${prev}\n\n---\n\n${data.content}` : data.content);
        setUrl("");
        toast.success(t("imported"));
      } else {
        toast.error(t("fetchFailed"));
      }
    } catch {
      toast.error(t("fetchFailed"));
    }
    setFetching(false);
  }

  return (
    <div>
      {/* Project selector */}
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3 mb-6"
        style={{ background: "var(--imp-surface-2)", border: "1px solid var(--imp-border)" }}
      >
        <div className="w-5 h-5 rounded-full border-2 shrink-0" style={{ borderColor: "var(--imp-border-2)" }} />
        <p className="text-[13.5px] m-0 flex-1" style={{ color: "var(--imp-text-2)" }}>
          {t("notice")}
        </p>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors"
            style={{ background: dropdownOpen ? "var(--imp-surface-3)" : "transparent" }}
          >
            {project.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={project.avatarUrl} alt={project.name} className="w-7 h-7 object-cover" style={{ borderRadius: "32%" }} />
            ) : (
              <BloomAvatar seed={project.name} size={28} shape="squircle" />
            )}
            <span style={{ color: "var(--imp-text)" }}>{project.name}</span>
          </button>
          {dropdownOpen && projects.length > 1 && (
            <div
              className="absolute right-0 top-full mt-1 rounded-lg py-1 w-[180px] z-10"
              style={{ background: "var(--imp-surface)", border: "1px solid var(--imp-border)", boxShadow: "var(--imp-shadow)" }}
            >
              {projects.filter((p) => p.id !== project.id).map((p) => (
                <button
                  key={p.id}
                  onClick={() => { onSwitchProject(p); setDropdownOpen(false); }}
                  className="w-full text-left px-3 py-2 text-[13px] hover:bg-[var(--imp-surface-2)] transition-colors"
                  style={{ color: "var(--imp-text)" }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* URL import */}
      <div className="mb-5">
        <Label className="mb-2 block">{t("importFromWebsite")}</Label>
        <div className="flex gap-2">
          <div
            className="flex-1 flex items-center gap-2.5 rounded-xl px-4 h-[42px]"
            style={{ background: "var(--imp-surface)", border: "1px solid var(--imp-border)" }}
          >
            <Globe size={15} style={{ color: "var(--imp-muted)" }} />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourproduct.com"
              className="flex-1 bg-transparent border-none outline-none text-[13.5px]"
              style={{ color: "var(--imp-text)" }}
            />
          </div>
          <Button
            onClick={handleFetchUrl}
            disabled={fetching || !url.trim()}
            className="imp-btn-primary h-[42px] px-4 rounded-xl text-[13px]"
          >
            {fetching ? <Loader2 size={14} className="animate-spin" /> : t("import")}
          </Button>
        </div>
        <p className="text-[12px] mt-1.5 px-1" style={{ color: "var(--imp-muted)" }}>
          {t("importHint")}
        </p>
      </div>

      {/* Manual brief */}
      <div className="mb-5">
        <Label className="mb-2 block">{t("accountBrief")}</Label>
        <Textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          rows={14}
          className="font-mono text-[13px] max-h-[50vh] overflow-y-auto"
          placeholder={t("placeholder")}
        />
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="imp-btn-primary">
          {saving ? t("saving") : t("saveBrief")}
        </Button>
      </div>
    </div>
  );
}

/* --- Image Styles Panel --- */
function ImageStylesPanel({ project, projects, onSwitchProject, onUpdate }: { project: Project; projects: Project[]; onSwitchProject: (p: Project) => void; onUpdate: (p: Project) => void }) {
  const ts = useTranslations("settings.brand");
  const tBrief = useTranslations("settings.brief");
  const tc = useTranslations("common");
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editContent, setEditContent] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newContent, setNewContent] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [brandLogoUrl, setBrandLogoUrl] = useState(project.brandLogoUrl || "");
  const [brandColors, setBrandColors] = useState(project.brandColors || "");
  const [brandAssetsNote, setBrandAssetsNote] = useState(project.brandAssetsNote || "");
  const [savingBrandKit, setSavingBrandKit] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadStyles() {
      const res = await fetch(`/api/styles?projectId=${project.id}`);
      if (cancelled) return;
      if (res.ok) setStyles(await res.json());
      setLoading(false);
    }

    void loadStyles();
    return () => {
      cancelled = true;
    };
  }, [project.id]);

  async function handleCreate() {
    if (!newName.trim() || !newContent.trim()) return;
    const res = await fetch("/api/styles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id, name: newName, content: newContent, isDefault: styles.length === 0 }),
    });
    if (res.ok) {
      const style = await res.json();
      setStyles((prev) => [...prev, style]);
      setNewName(""); setNewContent(""); setShowNew(false);
      toast.success(ts("styleCreated"));
    }
  }

  async function handleUpdate(styleId: string) {
    const res = await fetch("/api/styles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ styleId, name: editName, content: editContent }),
    });
    if (res.ok) {
      const updated = await res.json();
      setStyles((prev) => prev.map((s) => (s.id === styleId ? updated : s)));
      setEditingId(null);
      toast.success(ts("styleUpdated"));
    }
  }

  async function handleSetDefault(styleId: string) {
    const res = await fetch("/api/styles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ styleId, isDefault: true }),
    });
    if (res.ok) {
      setStyles((prev) => prev.map((s) => ({ ...s, isDefault: s.id === styleId })));
      toast.success(ts("defaultUpdated"));
    }
  }

  async function handleDelete(styleId: string) {
    const res = await fetch(`/api/styles?styleId=${styleId}`, { method: "DELETE" });
    if (res.ok) {
      setStyles((prev) => prev.filter((s) => s.id !== styleId));
      toast.success(ts("styleDeleted"));
    }
  }

  async function handleBrandKitSave() {
    setSavingBrandKit(true);
    const res = await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: project.id,
        brandLogoUrl: brandLogoUrl || null,
        brandColors,
        brandAssetsNote,
      }),
    });

    if (res.ok) {
      const updated = await res.json();
      onUpdate({ ...project, ...updated });
      toast.success(ts("kitSaved"));
    } else {
      toast.error(ts("kitSaveFailed"));
    }
    setSavingBrandKit(false);
  }

  function handleLogoUpload(file: File) {
    if (file.size > 2_000_000) {
      toast.error(ts("logoTooLarge"));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBrandLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  if (loading) return <p style={{ color: "var(--imp-muted)" }}>{ts("loading")}</p>;

  return (
    <div>
      {/* Info notice */}
      <div
        className="flex items-center gap-3 rounded-xl px-5 py-3.5 mb-6"
        style={{ background: "var(--imp-surface-2)", border: "1px solid var(--imp-border)" }}
      >
        <div className="w-5 h-5 rounded-full border-2 shrink-0" style={{ borderColor: "var(--imp-border-2)" }} />
        <p className="text-[13.5px] m-0 flex-1" style={{ color: "var(--imp-text-2)" }}>
          {ts("notice")}
        </p>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 shrink-0 px-2.5 py-1.5 rounded-lg transition-colors"
            style={{ background: dropdownOpen ? "var(--imp-surface-3)" : "transparent" }}
          >
            {project.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={project.avatarUrl} alt={project.name} className="w-7 h-7 object-cover" style={{ borderRadius: "32%" }} />
            ) : (
              <BloomAvatar seed={project.name} size={28} shape="squircle" />
            )}
            <div className="leading-tight text-left">
              <div className="text-[13px] font-semibold" style={{ color: "var(--imp-text)" }}>{project.name}</div>
              <div className="text-[11px] font-mono" style={{ color: "var(--imp-muted)" }}>@{project.handle}</div>
            </div>
            <ChevronLeft size={14} className="rotate-[270deg]" style={{ color: "var(--imp-muted)" }} />
          </button>
          {dropdownOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-[220px] rounded-xl py-1.5 z-50"
              style={{ background: "var(--imp-surface)", border: "1px solid var(--imp-border-2)", boxShadow: "0 8px 24px -8px rgba(0,0,0,0.2)" }}
            >
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { onSwitchProject(p); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[var(--imp-surface-2)]"
                >
                  {p.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.avatarUrl} alt={p.name} className="w-6 h-6 object-cover" style={{ borderRadius: "32%" }} />
                  ) : (
                    <BloomAvatar seed={p.name} size={24} shape="squircle" />
                  )}
                  <div className="leading-tight">
                    <div className="text-[12.5px] font-semibold" style={{ color: "var(--imp-text)" }}>{p.name}</div>
                    <div className="text-[10.5px] font-mono" style={{ color: "var(--imp-muted)" }}>@{p.handle}</div>
                  </div>
                  {p.id === project.id && <Check size={13} className="ml-auto" style={{ color: "var(--imp-accent)" }} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Brand kit */}
      <div
        className="rounded-xl p-5 mb-6"
        style={{ background: "var(--imp-surface)", border: "1px solid var(--imp-border)" }}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-[16px] font-bold m-0" style={{ color: "var(--imp-text)" }}>{ts("title")}</h2>
            <p className="text-[13px] mt-1 mb-0" style={{ color: "var(--imp-muted)" }}>
              {ts("desc", { handle: project.handle })}
            </p>
          </div>
          <Button onClick={handleBrandKitSave} disabled={savingBrandKit} className="imp-btn-primary h-9 rounded-[10px] text-[13px]">
            {savingBrandKit ? tBrief("saving") : ts("saveKit")}
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[180px_1fr] gap-5">
          <div>
            <Label className="mb-2 block">{ts("logo")}</Label>
            <label
              className="group flex h-[132px] w-[180px] cursor-pointer items-center justify-center overflow-hidden rounded-xl"
              style={{ background: "var(--imp-surface-2)", border: "1px dashed var(--imp-border-2)" }}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                }}
              />
              {brandLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brandLogoUrl} alt={`${project.name} logo`} className="max-h-full max-w-full object-contain p-4" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-[12.5px] font-medium" style={{ color: "var(--imp-muted)" }}>
                  <ImageIcon size={22} />
                  {ts("uploadLogo")}
                </div>
              )}
            </label>
            {brandLogoUrl && (
              <button
                onClick={() => setBrandLogoUrl("")}
                className="mt-2 text-[12.5px] font-medium"
                style={{ color: "var(--imp-muted)" }}
              >
                {ts("removeLogo")}
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">{ts("colors")}</Label>
              <Textarea
                value={brandColors}
                onChange={(e) => setBrandColors(e.target.value)}
                rows={4}
                className="font-mono text-[13px]"
                placeholder={"Primary: #FE3C9C\nBackground: #0A1020\nAccent: #F4D35E"}
              />
            </div>
            <div>
              <Label className="mb-2 block">{ts("assetNotes")}</Label>
              <Textarea
                value={brandAssetsNote}
                onChange={(e) => setBrandAssetsNote(e.target.value)}
                rows={4}
                className="text-[13px]"
                placeholder="Logo placement, clear space, forbidden colors, preferred image references, or website text rules."
              />
            </div>
          </div>
        </div>
      </div>

      <Button className="imp-btn-primary rounded-[10px] h-9 text-[13px] gap-1.5 mb-6" onClick={() => setShowNew(true)}>
        <Plus size={14} /> Add image style
      </Button>

      {/* Style cards */}
      <div className="flex flex-col gap-4">
        {styles.map((style) => (
          <div
            key={style.id}
            className="rounded-xl overflow-hidden"
            style={{ border: "1.5px dashed var(--imp-accent-line)" }}
          >
            {editingId === style.id ? (
              <div className="p-4 space-y-3">
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Style name" />
                <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={10} className="font-mono text-[13px] max-h-[40vh] overflow-y-auto" />
                <div className="flex gap-2">
                  <Button size="sm" className="imp-btn-primary" onClick={() => handleUpdate(style.id)}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--imp-border)" }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--imp-accent-soft)", color: "var(--imp-accent)" }}>
                      <ImageIcon size={14} />
                    </div>
                    <span className="text-[14.5px] font-bold" style={{ color: "var(--imp-text)" }}>{style.name}</span>
                    {style.isDefault && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ color: "var(--imp-accent)", background: "var(--imp-accent-soft)" }}>
                        <Check size={10} /> Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!style.isDefault && (
                      <button onClick={() => handleSetDefault(style.id)} className="text-[12px] font-medium px-2.5 py-1 rounded-lg transition-colors hover:bg-[var(--imp-surface-2)]" style={{ color: "var(--imp-text-2)" }}>
                        Set default
                      </button>
                    )}
                    <button
                      onClick={() => { setEditingId(style.id); setEditName(style.name); setEditContent(style.content); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--imp-surface-2)]" style={{ color: "var(--imp-muted)" }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(style.id)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--imp-surface-2)]" style={{ color: "var(--imp-muted)" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <pre className="m-0 px-4 py-3.5 text-[12.5px] leading-relaxed whitespace-pre-wrap font-mono" style={{ color: "var(--imp-text-2)", background: "transparent" }}>
                  {style.content}
                </pre>
              </>
            )}
          </div>
        ))}
      </div>

      {/* New style dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>New image style</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Style name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Electric Navy" autoFocus />
            </div>
            <div className="space-y-2">
              <Label>Style description</Label>
              <Textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={10} className="font-mono text-[13px] max-h-[40vh] overflow-y-auto" placeholder="Aspect ratio 16:9 (1600×900).&#10;&#10;Palette&#10;- Background: deep navy #0a1020 → #0d1426 gradient&#10;..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button className="imp-btn-primary" onClick={handleCreate}>Create style</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* --- X Accounts Panel --- */
function AccountsPanel({ projects, onDelete, onUpdate }: { projects: Project[]; onDelete: (id: string) => void; onUpdate: (p: Project) => void }) {
  const ta = useTranslations("settings.accounts");
  const tc = useTranslations("common");
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [xConfigured, setXConfigured] = useState(true);
  const [projectConnections, setProjectConnections] = useState<Record<string, boolean>>({});
  const [checkingX, setCheckingX] = useState(true);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editHandle, setEditHandle] = useState("");
  const router = useRouter();

  async function handleSaveEdit(projectId: string) {
    if (!editName.trim() || !editHandle.trim()) return;
    const res = await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, name: editName.trim(), handle: editHandle.trim().replace(/^@/, "") }),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdate({ ...projects.find((p) => p.id === projectId)!, name: updated.name, handle: updated.handle });
      toast.success(ta("accountUpdated"));
    }
    setEditingId(null);
  }


  useEffect(() => {
    let cancelled = false;

    async function loadConnections() {
      const results: Record<string, boolean> = {};
      const checks = projects.map(async (p) => {
        const res = await fetch(`/api/x/connection?projectId=${p.id}`);
        const data = res.ok ? await res.json() : null;
        if (!cancelled) {
          if (data) setXConfigured(Boolean(data.configured));
          results[p.id] = Boolean(data?.connected);
        }
      });
      await Promise.all(checks);
      if (!cancelled) {
        setProjectConnections(results);
        setCheckingX(false);
      }
    }

    void loadConnections();
    return () => { cancelled = true; };
  }, [projects]);

  async function handleDisconnectProject(projectId: string) {
    setDisconnectingId(projectId);
    const res = await fetch(`/api/x/connection?projectId=${projectId}`, { method: "DELETE" });
    if (res.ok) {
      setProjectConnections((prev) => ({ ...prev, [projectId]: false }));
      toast.success(ta("disconnected"));
    } else {
      toast.error(ta("disconnectFailed"));
    }
    setDisconnectingId(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, handle }),
    });
    if (res.ok) {
      setAddOpen(false); setName(""); setHandle("");
      toast.success(ta("accountAdded"));
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete(projectId: string) {
    const res = await fetch(`/api/projects?projectId=${projectId}`, { method: "DELETE" });
    if (res.ok) {
      onDelete(projectId);
      toast.success(ta("accountRemoved"));
    }
  }

  async function handleAvatarUpload(projectId: string, file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, avatarUrl: dataUrl }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate({ ...projects.find((p) => p.id === projectId)!, avatarUrl: updated.avatarUrl });
        toast.success(ta("avatarUpdated"));
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Button className="imp-btn-primary rounded-[10px] h-9 text-[13px] gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus size={14} /> {ta("add")}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {projects.map((p, i) => (
          <div
            key={p.id}
            className="flex items-center gap-4 rounded-xl px-5 py-4 transition-all hover:border-[var(--imp-border-2)]"
            style={{ background: "var(--imp-surface)", border: "1px solid var(--imp-border)" }}
          >
            {/* Avatar with edit overlay */}
            <label className="relative group cursor-pointer shrink-0">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(p.id, f); }}
              />
              {p.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.avatarUrl}
                  alt={p.name}
                  className="w-[44px] h-[44px] rounded-full object-cover"
                />
              ) : (
                <BloomAvatar seed={p.name} size={44} />
              )}
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Pencil size={14} className="text-white" />
              </div>
            </label>
            <div className="flex-1 min-w-0">
              {editingId === p.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-7 text-[13.5px] w-[140px]"
                    placeholder={tc("name")}
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(p.id); if (e.key === "Escape") setEditingId(null); }}
                  />
                  <span className="text-[13.5px]" style={{ color: "var(--imp-muted)" }}>@</span>
                  <Input
                    value={editHandle}
                    onChange={(e) => setEditHandle(e.target.value.replace(/^@/, ""))}
                    className="h-7 text-[13.5px] w-[140px] font-mono"
                    placeholder={ta("handlePlaceholder")}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(p.id); if (e.key === "Escape") setEditingId(null); }}
                  />
                  <Button size="sm" className="h-7 text-[12px] gap-1 imp-btn-primary" onClick={() => handleSaveEdit(p.id)}>
                    <Check size={12} /> {tc("save")}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-[12px]" onClick={() => setEditingId(null)}>
                    {tc("cancel")}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group/name">
                  <span className="text-[15px] font-bold" style={{ color: "var(--imp-text)" }}>{p.name}</span>
                  <span className="text-[13.5px] font-mono" style={{ color: "var(--imp-muted)" }}>@{p.handle}</span>
                  <button
                    onClick={() => { setEditingId(p.id); setEditName(p.name); setEditHandle(p.handle); }}
                    className="w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover/name:opacity-100 transition-opacity hover:bg-[var(--imp-surface-3)]"
                    style={{ color: "var(--imp-muted)" }}
                    title={ta("editNameHandle")}
                  >
                    <Pencil size={12} />
                  </button>
                </div>
              )}
              <div className="text-[12.5px] mt-0.5" style={{ color: "var(--imp-muted)" }}>
                {ta("imageStyles", { count: p._count.styles })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {xConfigured && !checkingX && (
                projectConnections[p.id] ? (
                  <div className="flex items-center gap-1.5">
                    <span
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12.5px] font-semibold"
                      style={{ color: "var(--s-image)", background: "var(--s-image-bg)" }}
                    >
                      <Check size={13} /> {ta("connected", { username: p.handle })}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-[12.5px] gap-1.5"
                      onClick={() => handleDisconnectProject(p.id)}
                      disabled={disconnectingId === p.id}
                    >
                      {disconnectingId === p.id ? <Loader2 size={13} className="animate-spin" /> : null}
                      {ta("disconnect")}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[12.5px] gap-1.5"
                    onClick={() => { window.location.href = `/api/x/connect?projectId=${p.id}`; }}
                  >
                    <X size={13} /> {ta("connect", { handle: p.handle })}
                  </Button>
                )
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[12.5px] gap-1.5"
                onClick={() => router.push("/settings?tab=styles")}
              >
                <ImageIcon size={13} /> {ta("brandKit")}
              </Button>
              <button
                onClick={() => handleDelete(p.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--imp-surface-3)]"
                style={{ color: "var(--imp-muted)" }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{ta("add")}</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>{ta("accountName")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={ta("accountPlaceholder")} required autoFocus />
            </div>
            <div className="space-y-2">
              <Label>{ta("twitterHandle")}</Label>
              <Input value={handle} onChange={(e) => setHandle(e.target.value.replace(/^@/, ""))} placeholder={ta("handlePlaceholder")} required />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>{tc("cancel")}</Button>
              <Button type="submit" className="imp-btn-primary" disabled={loading}>{loading ? ta("adding") : ta("addAccount")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* --- Appearance Panel --- */
function SecurityPanel() {
  const ts = useTranslations("settings.security");
  const tAuth = useTranslations("auth");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(tAuth("passwordMin"));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(tAuth("passwordMismatch"));
      return;
    }

    setSaving(true);
    const res = await fetch("/api/auth/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, password }),
    });
    if (res.ok) {
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
      toast.success(ts("updated"));
    } else {
      const data = await res.json();
      toast.error(data.error || ts("updateFailed"));
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSave} className="max-w-[420px] space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current-password">{ts("currentPassword")}</Label>
        <Input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password">{ts("newPassword")}</Label>
        <Input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-new-password">{ts("confirmNewPassword")}</Label>
        <Input
          id="confirm-new-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={6}
          required
        />
      </div>
      <Button type="submit" className="imp-btn-primary" disabled={saving}>
        {saving ? ts("updating") : ts("updatePassword")}
      </Button>
    </form>
  );
}

function getStoredPreference(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(key) || fallback;
}

function AppearancePanel() {
  const ta = useTranslations("settings.appearance");
  const tp = useTranslations("settingsPopover");
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [accent, setAccent] = useState(() => getStoredPreference("impulso-accent", "tomo"));

  const ACCENT_LABEL_KEYS: Record<string, string> = { tomo: "pink", sky: "sky", indigo: "indigo", violet: "violet" };

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent);
    localStorage.setItem("impulso-accent", accent);
  }, [accent]);

  return (
    <div className="max-w-[580px]">
      {/* Theme */}
      <div className="flex items-center justify-between py-5" style={{ borderBottom: "1px solid var(--imp-border)" }}>
        <div>
          <div className="text-[15px] font-semibold" style={{ color: "var(--imp-text)" }}>{ta("theme")}</div>
          <div className="text-[13px] mt-0.5" style={{ color: "var(--imp-muted)" }}>{ta("themeDesc")}</div>
        </div>
        <div
          className="flex items-center h-[38px] rounded-full p-1 gap-0.5"
          style={{ background: "var(--imp-surface-2)", border: "1px solid var(--imp-border)" }}
        >
          <button
            onClick={() => setTheme("dark")}
            className="flex items-center gap-1.5 h-[30px] px-3.5 rounded-full text-[13px] font-medium transition-all"
            style={{
              background: mounted && resolvedTheme === "dark" ? "var(--imp-surface)" : "transparent",
              color: mounted && resolvedTheme === "dark" ? "var(--imp-text)" : "var(--imp-muted)",
              boxShadow: mounted && resolvedTheme === "dark" ? "var(--imp-shadow-sm)" : "none",
            }}
          >
            <Moon size={14} /> {ta("dark")}
          </button>
          <button
            onClick={() => setTheme("light")}
            className="flex items-center gap-1.5 h-[30px] px-3.5 rounded-full text-[13px] font-medium transition-all"
            style={{
              background: mounted && resolvedTheme === "light" ? "var(--imp-surface)" : "transparent",
              color: mounted && resolvedTheme === "light" ? "var(--imp-accent)" : "var(--imp-muted)",
              boxShadow: mounted && resolvedTheme === "light" ? "var(--imp-shadow-sm)" : "none",
            }}
          >
            <Sun size={14} /> {ta("light")}
          </button>
        </div>
      </div>

      {/* Accent color */}
      <div className="flex items-center justify-between py-5" style={{ borderBottom: "1px solid var(--imp-border)" }}>
        <div>
          <div className="text-[15px] font-semibold" style={{ color: "var(--imp-text)" }}>{ta("accentColor")}</div>
          <div className="text-[13px] mt-0.5" style={{ color: "var(--imp-muted)" }}>{ta("accentDesc")}</div>
        </div>
        <div className="flex items-center gap-3">
          {ACCENTS.map((a) => (
            <button
              key={a.key}
              onClick={() => setAccent(a.key)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-transform"
              style={{
                background: a.hex,
                transform: accent === a.key ? "scale(1.08)" : "scale(1)",
                boxShadow: accent === a.key ? `0 0 0 2.5px var(--imp-bg), 0 0 0 4.5px ${a.hex}` : "none",
              }}
              title={tp(ACCENT_LABEL_KEYS[a.key])}
            >
              {accent === a.key && (
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}

/* --- Version Panel --- */

function VersionPanel() {
  const tv = useTranslations("settings.version");

  return (
    <div className="max-w-[580px]">
      <div className="text-[13px] mb-6" style={{ color: "var(--imp-muted)" }}>
        {tv("currentVersion")}: <span className="font-semibold" style={{ color: "var(--imp-text)" }}>{VERSION_LOG[0].version}</span>
      </div>

      <div className="flex flex-col gap-0">
        {VERSION_LOG.map((entry, idx) => (
          <div
            key={entry.version}
            className="py-5"
            style={{ borderBottom: idx < VERSION_LOG.length - 1 ? "1px solid var(--imp-border)" : undefined }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span
                className="text-[13px] font-bold px-2.5 py-0.5 rounded-full"
                style={{ background: "var(--imp-accent-soft)", color: "var(--imp-accent)" }}
              >
                v{entry.version}
              </span>
              <span className="text-[12px]" style={{ color: "var(--imp-faint)" }}>
                {entry.date}
              </span>
            </div>
            <ul className="list-none m-0 p-0 flex flex-col gap-1.5">
              {entry.changeKeys.map((key) => (
                <li key={key} className="flex items-start gap-2 text-[13.5px]" style={{ color: "var(--imp-text-2)" }}>
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--imp-accent)" }} />
                  {tv(key)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- Main Settings Page --- */
const SECTION_ICONS: Record<string, typeof ImageIcon> = {
  brief: FileText,
  styles: ImageIcon,
  accounts: X,
  security: Lock,
  appearance: SlidersHorizontal,
  version: Tag,
};

const VALID_SECTION_IDS = new Set(NAV_ITEMS.map((n) => n.id));

function buildSettingsQs(params: URLSearchParams) {
  const qs = params.toString();
  return qs ? `/settings?${qs}` : "/settings";
}

export function SettingsPage({ projects: initialProjects, user }: SettingsPageProps) {
  const tn = useTranslations("settings.nav");
  const tSec = useTranslations("settings.sections");
  const tc = useTranslations("common");
  const searchParams = useSearchParams();
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);

  const handleParam = searchParams.get("account");
  const projectFromUrl = handleParam
    ? initialProjects.find((p) => p.handle === handleParam) ?? null
    : null;
  const [selectedProject, setSelectedProjectState] = useState<Project | null>(
    projectFromUrl ?? initialProjects[0] ?? null
  );

  const replaceUrl = useCallback((params: URLSearchParams) => {
    router.replace(buildSettingsQs(params), { scroll: false });
  }, [router]);

  const setSelectedProject = useCallback((project: Project | null) => {
    setSelectedProjectState(project);
    const params = new URLSearchParams(searchParams.toString());
    if (!project || project.handle === initialProjects[0]?.handle) {
      params.delete("account");
    } else {
      params.set("account", project.handle);
    }
    replaceUrl(params);
  }, [searchParams, replaceUrl, initialProjects]);

  const tabParam = searchParams.get("tab");
  const activeSection = tabParam && VALID_SECTION_IDS.has(tabParam) ? tabParam : "brief";

  const setActiveSection = useCallback((id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id === "brief") {
      params.delete("tab");
    } else {
      params.set("tab", id);
    }
    replaceUrl(params);
  }, [searchParams, replaceUrl]);

  function handleProjectCreated(project: Project & { _count?: { tweets: number; styles: number } }) {
    const p = { ...project, _count: project._count || { tweets: 0, styles: 0 } };
    setProjects((prev) => [p, ...prev]);
    setSelectedProjectState(p);
    const params = new URLSearchParams(searchParams.toString());
    params.set("account", p.handle);
    replaceUrl(params);
  }

  function handleProjectDeleted(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (selectedProject?.id === id) {
      const next = projects.find((p) => p.id !== id) ?? null;
      setSelectedProjectState(next);
      const params = new URLSearchParams(searchParams.toString());
      if (!next || next.handle === initialProjects[0]?.handle) {
        params.delete("account");
      } else {
        params.set("account", next.handle);
      }
      replaceUrl(params);
    }
  }

  function handleProjectUpdated(updated: Project) {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
    if (selectedProject?.id === updated.id) {
      setSelectedProjectState({ ...selectedProject, ...updated });
    }
  }

  const Icon = SECTION_ICONS[activeSection];

  return (
    <div className="flex flex-col h-screen">
      <TopNav
        projects={projects as (Project & { _count: { tweets: number } })[]}
        selected={selectedProject as (Project & { _count: { tweets: number } }) | null}
        onSelect={(p) => setSelectedProject(p as unknown as Project)}
        onCreated={(p) => handleProjectCreated(p as unknown as Project)}
        user={user}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[210px] shrink-0 flex flex-col pt-5 px-4" style={{ borderRight: "1px solid var(--imp-border)" }}>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-[13px] font-medium mb-5 px-1 transition-colors hover:text-[var(--imp-accent)]"
            style={{ color: "var(--imp-text-2)" }}
          >
            <ChevronLeft size={14} /> {tc("backToPipeline")}
          </button>

          <div className="text-[11px] font-semibold uppercase tracking-wider px-2 mb-2" style={{ color: "var(--imp-faint)" }}>
            {tc("settings")}
          </div>

          <nav className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => {
              const on = activeSection === item.id;
              const NavIcon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13.5px] font-medium text-left transition-colors hover:bg-[var(--imp-surface-2)]"
                  style={{
                    background: on ? "var(--imp-accent-soft)" : undefined,
                    color: on ? "var(--imp-accent)" : "var(--imp-text-2)",
                  }}
                >
                  <NavIcon size={15} />
                  {tn(item.id)}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-auto p-10 pl-12">
          {/* Section header */}
          <div className="flex items-center gap-3.5 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "var(--imp-accent-soft)", color: "var(--imp-accent)" }}
            >
              <Icon size={20} />
            </div>
            <h1 className="text-[24px] font-bold tracking-tight m-0" style={{ color: "var(--imp-text)" }}>
              {tSec(`${activeSection}Title`)}
            </h1>
          </div>
          <p className="text-[14px] mb-7 ml-[54px] mt-0" style={{ color: "var(--imp-muted)" }}>
            {tSec(`${activeSection}Desc`)}
          </p>

          {/* Panel content */}
          <div className="ml-[54px]">
            {activeSection === "brief" && selectedProject && <AccountBriefPanel key={selectedProject.id} project={selectedProject} projects={projects} onSwitchProject={(p) => setSelectedProject(p)} onUpdate={handleProjectUpdated} />}
            {activeSection === "styles" && selectedProject && <ImageStylesPanel key={selectedProject.id} project={selectedProject} projects={projects} onSwitchProject={(p) => setSelectedProject(p)} onUpdate={handleProjectUpdated} />}
            {activeSection === "accounts" && <AccountsPanel projects={projects} onDelete={handleProjectDeleted} onUpdate={handleProjectUpdated} />}
            {activeSection === "security" && <SecurityPanel />}
            {activeSection === "appearance" && <AppearancePanel />}
            {activeSection === "version" && <VersionPanel />}
          </div>
        </main>
      </div>
    </div>
  );
}
