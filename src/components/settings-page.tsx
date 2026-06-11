"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { useRouter, useSearchParams } from "next/navigation";
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
} from "lucide-react";

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
];

const ACCENTS = [
  { key: "tomo", hex: "#FE3C9C", label: "Pink" },
  { key: "sky", hex: "#0ea5e9", label: "Sky" },
  { key: "indigo", hex: "#6366f1", label: "Indigo" },
  { key: "violet", hex: "#a855f7", label: "Violet" },
];

const DENSITIES = [
  { key: "compact", label: "Compact" },
  { key: "regular", label: "Regular" },
  { key: "comfy", label: "Comfy" },
];

/* --- Account Brief Panel --- */
function AccountBriefPanel({ project, projects, onSwitchProject, onUpdate }: { project: Project; projects: Project[]; onSwitchProject: (p: Project) => void; onUpdate: (p: Project) => void }) {
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
      toast.success("Brief saved");
    } else {
      toast.error("Failed to save brief");
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
        toast.success("Website content imported");
      } else {
        toast.error("Failed to fetch website");
      }
    } catch {
      toast.error("Failed to fetch website");
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
          Brief is saved <strong style={{ color: "var(--imp-text)" }}>per X account</strong>. You&apos;re editing the brief for:
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
              <div
                className="w-7 h-7 flex items-center justify-center text-[11px] font-bold text-white"
                style={{ background: "var(--imp-accent-grad)", color: "var(--imp-on-accent)", borderRadius: "32%" }}
              >
                {project.name[0]}
              </div>
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
        <Label className="mb-2 block">Import from website</Label>
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
            {fetching ? <Loader2 size={14} className="animate-spin" /> : "Import"}
          </Button>
        </div>
        <p className="text-[12px] mt-1.5 px-1" style={{ color: "var(--imp-muted)" }}>
          We&apos;ll extract key info from the page to use as context for content generation.
        </p>
      </div>

      {/* Manual brief */}
      <div className="mb-5">
        <Label className="mb-2 block">Account brief</Label>
        <Textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          rows={14}
          className="font-mono text-[13px] max-h-[50vh] overflow-y-auto"
          placeholder={"Describe your brand, target audience, tone of voice, key topics, and any guidelines for content generation.\n\nExample:\n- Brand: PayGate — Web3 payment infrastructure\n- Audience: Crypto-native builders, DeFi users\n- Tone: Technical but accessible, no hype\n- Topics: stablecoins, payment rails, cross-chain..."}
        />
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="imp-btn-primary">
          {saving ? "Saving..." : "Save brief"}
        </Button>
      </div>
    </div>
  );
}

/* --- Image Styles Panel --- */
function ImageStylesPanel({ project, projects, onSwitchProject, onUpdate }: { project: Project; projects: Project[]; onSwitchProject: (p: Project) => void; onUpdate: (p: Project) => void }) {
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
      toast.success("Style created");
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
      toast.success("Style updated");
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
      toast.success("Default style updated");
    }
  }

  async function handleDelete(styleId: string) {
    const res = await fetch(`/api/styles?styleId=${styleId}`, { method: "DELETE" });
    if (res.ok) {
      setStyles((prev) => prev.filter((s) => s.id !== styleId));
      toast.success("Style deleted");
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
      toast.success("Brand kit saved");
    } else {
      toast.error("Failed to save brand kit");
    }
    setSavingBrandKit(false);
  }

  function handleLogoUpload(file: File) {
    if (file.size > 2_000_000) {
      toast.error("Logo must be under 2 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBrandLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  if (loading) return <p style={{ color: "var(--imp-muted)" }}>Loading styles...</p>;

  return (
    <div>
      {/* Info notice */}
      <div
        className="flex items-center gap-3 rounded-xl px-5 py-3.5 mb-6"
        style={{ background: "var(--imp-surface-2)", border: "1px solid var(--imp-border)" }}
      >
        <div className="w-5 h-5 rounded-full border-2 shrink-0" style={{ borderColor: "var(--imp-border-2)" }} />
        <p className="text-[13.5px] m-0 flex-1" style={{ color: "var(--imp-text-2)" }}>
          Styles are saved <strong style={{ color: "var(--imp-text)" }}>per X account</strong> — they&apos;re never shared between accounts. You&apos;re editing styles for:
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
              <div
                className="w-7 h-7 flex items-center justify-center text-[10px] font-bold"
                style={{ background: "var(--imp-accent-grad)", color: "var(--imp-on-accent)", borderRadius: "32%" }}
              >
                {project.name[0]}
              </div>
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
                    <div
                      className="w-6 h-6 flex items-center justify-center text-[9px] font-bold"
                      style={{ background: "var(--imp-accent-grad)", color: "var(--imp-on-accent)", borderRadius: "32%" }}
                    >
                      {p.name[0]}
                    </div>
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
            <h2 className="text-[16px] font-bold m-0" style={{ color: "var(--imp-text)" }}>Brand kit</h2>
            <p className="text-[13px] mt-1 mb-0" style={{ color: "var(--imp-muted)" }}>
              Saved assets are included when Impulso creates image briefs and prompts for @{project.handle}.
            </p>
          </div>
          <Button onClick={handleBrandKitSave} disabled={savingBrandKit} className="imp-btn-primary h-9 rounded-[10px] text-[13px]">
            {savingBrandKit ? "Saving..." : "Save kit"}
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[180px_1fr] gap-5">
          <div>
            <Label className="mb-2 block">Logo</Label>
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
                  Upload logo
                </div>
              )}
            </label>
            {brandLogoUrl && (
              <button
                onClick={() => setBrandLogoUrl("")}
                className="mt-2 text-[12.5px] font-medium"
                style={{ color: "var(--imp-muted)" }}
              >
                Remove logo
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Brand colors</Label>
              <Textarea
                value={brandColors}
                onChange={(e) => setBrandColors(e.target.value)}
                rows={4}
                className="font-mono text-[13px]"
                placeholder={"Primary: #FE3C9C\nBackground: #0A1020\nAccent: #F4D35E"}
              />
            </div>
            <div>
              <Label className="mb-2 block">Asset notes</Label>
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
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [xConnected, setXConnected] = useState(false);
  const [xConfigured, setXConfigured] = useState(true);
  const [checkingX, setCheckingX] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const router = useRouter();

  const AVATAR_COLORS = ["#FE3C9C", "#0ea5e9", "#a855f7", "#f59e0b", "#22c55e", "#6366f1"];

  function loadConnection() {
    let cancelled = false;

    async function run() {
      const res = await fetch("/api/x/connection");
      if (!cancelled) {
        const data = res.ok ? await res.json() : null;
        setXConfigured(Boolean(data?.configured));
        setXConnected(Boolean(data?.connected));
        setCheckingX(false);
      }
    }

    void run();
    return () => { cancelled = true; };
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(loadConnection, []);

  async function handleDisconnectX() {
    setDisconnecting(true);
    const res = await fetch("/api/x/connection", { method: "DELETE" });
    if (res.ok) {
      setXConnected(false);
      window.location.href = "/api/x/connect";
    } else {
      toast.error("Failed to disconnect");
      setDisconnecting(false);
    }
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
      toast.success("Account added");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete(projectId: string) {
    const res = await fetch(`/api/projects?projectId=${projectId}`, { method: "DELETE" });
    if (res.ok) {
      onDelete(projectId);
      toast.success("Account removed");
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
        toast.success("Avatar updated");
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Button className="imp-btn-primary rounded-[10px] h-9 text-[13px] gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus size={14} /> Add X account
        </Button>
        {!xConfigured ? (
          <Button
            variant="outline"
            className="rounded-[10px] h-9 text-[13px] gap-1.5"
            disabled
          >
            <X size={14} /> X not configured
          </Button>
        ) : xConnected ? (
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] text-[12.5px] font-semibold"
              style={{ color: "var(--s-image)", background: "var(--s-image-bg)", border: "1px solid var(--imp-border)" }}
            >
              <Check size={14} /> X connected
            </span>
            <Button
              variant="outline"
              className="rounded-[10px] h-9 text-[13px] gap-1.5"
              onClick={async () => {
                if (!confirm("Disconnect and reconnect X? This will refresh your token for all accounts.")) return;
                await handleDisconnectX();
              }}
              disabled={disconnecting}
            >
              {disconnecting ? <Loader2 size={14} className="animate-spin" /> : null}
              {disconnecting ? "Reconnecting..." : "Reconnect"}
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="rounded-[10px] h-9 text-[13px] gap-1.5"
            disabled={checkingX}
            onClick={() => { window.location.href = "/api/x/connect"; }}
          >
            {checkingX ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
            Connect X
          </Button>
        )}
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
                <div
                  className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-[16px] font-bold text-white"
                  style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                >
                  {p.name[0]}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Pencil size={14} className="text-white" />
              </div>
            </label>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold" style={{ color: "var(--imp-text)" }}>{p.name}</span>
                <span className="text-[13.5px] font-mono" style={{ color: "var(--imp-muted)" }}>@{p.handle}</span>
              </div>
              <div className="text-[12.5px] mt-0.5" style={{ color: "var(--imp-muted)" }}>
                {p._count.styles} image style{p._count.styles !== 1 ? "s" : ""}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {xConfigured && xConnected && (
                <span
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12.5px] font-semibold"
                  style={{ color: "var(--s-image)", background: "var(--s-image-bg)" }}
                >
                  <Check size={13} /> Connected @{p.handle}
                </span>
              )}
              {xConfigured && !xConnected && !checkingX && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[12.5px] gap-1.5"
                  onClick={() => { window.location.href = "/api/x/connect"; }}
                >
                  <X size={13} /> Connect @{p.handle}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[12.5px] gap-1.5"
                onClick={() => router.push("/settings?tab=styles")}
              >
                <ImageIcon size={13} /> Brand kit
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
          <DialogHeader><DialogTitle>Add X account</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Account name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hyperdrive" required autoFocus />
            </div>
            <div className="space-y-2">
              <Label>Twitter handle</Label>
              <Input value={handle} onChange={(e) => setHandle(e.target.value.replace(/^@/, ""))} placeholder="handle" required />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" className="imp-btn-primary" disabled={loading}>{loading ? "Adding..." : "Add account"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* --- Appearance Panel --- */
function SecurityPanel() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
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
      toast.success("Password updated");
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to update password");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSave} className="max-w-[420px] space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current-password">Current password</Label>
        <Input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password">New password</Label>
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
        <Label htmlFor="confirm-new-password">Confirm new password</Label>
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
        {saving ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}

function getStoredPreference(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(key) || fallback;
}

function AppearancePanel() {
  const { theme, setTheme } = useTheme();
  const [accent, setAccent] = useState(() => getStoredPreference("impulso-accent", "tomo"));
  const [density, setDensity] = useState(() => getStoredPreference("impulso-density", "regular"));

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent);
    localStorage.setItem("impulso-accent", accent);
  }, [accent]);

  useEffect(() => {
    document.documentElement.setAttribute("data-density", density);
    localStorage.setItem("impulso-density", density);
  }, [density]);

  return (
    <div className="max-w-[580px]">
      {/* Theme */}
      <div className="flex items-center justify-between py-5" style={{ borderBottom: "1px solid var(--imp-border)" }}>
        <div>
          <div className="text-[15px] font-semibold" style={{ color: "var(--imp-text)" }}>Theme</div>
          <div className="text-[13px] mt-0.5" style={{ color: "var(--imp-muted)" }}>Switch between dark and light.</div>
        </div>
        <div
          className="flex items-center h-[38px] rounded-full p-1 gap-0.5"
          style={{ background: "var(--imp-surface-2)", border: "1px solid var(--imp-border)" }}
        >
          <button
            onClick={() => setTheme("dark")}
            className="flex items-center gap-1.5 h-[30px] px-3.5 rounded-full text-[13px] font-medium transition-all"
            style={{
              background: theme === "dark" ? "var(--imp-surface)" : "transparent",
              color: theme === "dark" ? "var(--imp-text)" : "var(--imp-muted)",
              boxShadow: theme === "dark" ? "var(--imp-shadow-sm)" : "none",
            }}
          >
            <Moon size={14} /> Dark
          </button>
          <button
            onClick={() => setTheme("light")}
            className="flex items-center gap-1.5 h-[30px] px-3.5 rounded-full text-[13px] font-medium transition-all"
            style={{
              background: theme === "light" ? "var(--imp-surface)" : "transparent",
              color: theme === "light" ? "var(--imp-accent)" : "var(--imp-muted)",
              boxShadow: theme === "light" ? "var(--imp-shadow-sm)" : "none",
            }}
          >
            <Sun size={14} /> Light
          </button>
        </div>
      </div>

      {/* Accent color */}
      <div className="flex items-center justify-between py-5" style={{ borderBottom: "1px solid var(--imp-border)" }}>
        <div>
          <div className="text-[15px] font-semibold" style={{ color: "var(--imp-text)" }}>Accent color</div>
          <div className="text-[13px] mt-0.5" style={{ color: "var(--imp-muted)" }}>Used for highlights, buttons, and focus states.</div>
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
              title={a.label}
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

      {/* Density */}
      <div className="flex items-center justify-between py-5" style={{ borderBottom: "1px solid var(--imp-border)" }}>
        <div>
          <div className="text-[15px] font-semibold" style={{ color: "var(--imp-text)" }}>Density</div>
          <div className="text-[13px] mt-0.5" style={{ color: "var(--imp-muted)" }}>Spacing of cards across the pipeline.</div>
        </div>
        <div
          className="flex items-center h-[38px] rounded-full p-1 gap-0.5"
          style={{ background: "var(--imp-surface-2)", border: "1px solid var(--imp-border)" }}
        >
          {DENSITIES.map((d) => (
            <button
              key={d.key}
              onClick={() => setDensity(d.key)}
              className="h-[30px] px-4 rounded-full text-[13px] font-medium transition-all"
              style={{
                background: density === d.key ? "var(--imp-surface)" : "transparent",
                color: density === d.key ? "var(--imp-accent)" : "var(--imp-muted)",
                boxShadow: density === d.key ? "var(--imp-shadow-sm)" : "none",
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --- Main Settings Page --- */
const SECTION_META: Record<string, { icon: typeof ImageIcon; title: string; desc: string }> = {
  brief: { icon: FileText, title: "Account brief", desc: "Context about your brand that AI reads before generating tweets. The more detail, the better the output." },
  styles: { icon: ImageIcon, title: "Brand kit", desc: "Logo, colors, and reusable visual briefs Impulso applies when generating images." },
  accounts: { icon: X, title: "X accounts", desc: "Connect the handles you manage. Each account keeps its own pipeline, schedule, and image styles." },
  security: { icon: Lock, title: "Security", desc: "Update the password used to sign in with your email." },
  appearance: { icon: SlidersHorizontal, title: "Appearance", desc: "Personal display preferences for this workspace. These only affect your view." },
};

const VALID_SECTION_IDS = new Set(NAV_ITEMS.map((n) => n.id));

function buildSettingsQs(params: URLSearchParams) {
  const qs = params.toString();
  return qs ? `/settings?${qs}` : "/settings";
}

export function SettingsPage({ projects: initialProjects, user }: SettingsPageProps) {
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

  const meta = SECTION_META[activeSection];
  const Icon = meta.icon;

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
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-[13px] font-medium mb-5 px-1 transition-colors hover:text-[var(--imp-accent)]"
            style={{ color: "var(--imp-text-2)" }}
          >
            <ChevronLeft size={14} /> Back to pipeline
          </button>

          <div className="text-[11px] font-semibold uppercase tracking-wider px-2 mb-2" style={{ color: "var(--imp-faint)" }}>
            Settings
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
                  {item.label}
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
              {meta.title}
            </h1>
          </div>
          <p className="text-[14px] mb-7 ml-[54px] mt-0" style={{ color: "var(--imp-muted)" }}>
            {meta.desc}
          </p>

          {/* Panel content */}
          <div className="ml-[54px]">
            {activeSection === "brief" && selectedProject && <AccountBriefPanel key={selectedProject.id} project={selectedProject} projects={projects} onSwitchProject={(p) => setSelectedProject(p)} onUpdate={handleProjectUpdated} />}
            {activeSection === "styles" && selectedProject && <ImageStylesPanel key={selectedProject.id} project={selectedProject} projects={projects} onSwitchProject={(p) => setSelectedProject(p)} onUpdate={handleProjectUpdated} />}
            {activeSection === "accounts" && <AccountsPanel projects={projects} onDelete={handleProjectDeleted} onUpdate={handleProjectUpdated} />}
            {activeSection === "security" && <SecurityPanel />}
            {activeSection === "appearance" && <AppearancePanel />}
          </div>
        </main>
      </div>
    </div>
  );
}
