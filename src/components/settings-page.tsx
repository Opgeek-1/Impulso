"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

/* --- Types --- */
interface Project {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  avatarUrl?: string | null;
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
  { id: "styles", label: "Image styles", icon: ImageIcon },
  { id: "accounts", label: "X accounts", icon: X },
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

/* --- Image Styles Panel --- */
function ImageStylesPanel({ project, projects, onSwitchProject }: { project: Project; projects: Project[]; onSwitchProject: (p: Project) => void }) {
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editContent, setEditContent] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newContent, setNewContent] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fetchStyles = useCallback(async () => {
    const res = await fetch(`/api/styles?projectId=${project.id}`);
    if (res.ok) setStyles(await res.json());
    setLoading(false);
  }, [project.id]);

  useEffect(() => { fetchStyles(); }, [fetchStyles]);

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

  if (loading) return <p style={{ color: "var(--imp-muted)" }}>Loading styles...</p>;

  return (
    <div>
      <Button className="imp-btn-primary rounded-[10px] h-9 text-[13px] gap-1.5 mb-6" onClick={() => setShowNew(true)}>
        <Plus size={14} /> Add style
      </Button>

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
  const router = useRouter();

  const AVATAR_COLORS = ["#FE3C9C", "#0ea5e9", "#a855f7", "#f59e0b", "#22c55e", "#6366f1"];

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
      <Button className="imp-btn-primary rounded-[10px] h-9 text-[13px] gap-1.5 mb-6" onClick={() => setAddOpen(true)}>
        <Plus size={14} /> Add X account
      </Button>

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
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[12.5px] gap-1.5"
                onClick={() => router.push("/settings?tab=styles")}
              >
                <ImageIcon size={13} /> Styles
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
function AppearancePanel() {
  const { theme, setTheme } = useTheme();
  const [accent, setAccent] = useState("tomo");
  const [density, setDensity] = useState("regular");

  useEffect(() => {
    const saved = localStorage.getItem("impulso-accent");
    if (saved) setAccent(saved);
    const savedDensity = localStorage.getItem("impulso-density");
    if (savedDensity) setDensity(savedDensity);
  }, []);

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
  styles: { icon: ImageIcon, title: "Image styles", desc: "Reusable visual briefs Impulso applies when generating images. Pick one from the Generate button on any card." },
  accounts: { icon: X, title: "X accounts", desc: "Connect the handles you manage. Each account keeps its own pipeline, schedule, and image styles." },
  appearance: { icon: SlidersHorizontal, title: "Appearance", desc: "Personal display preferences for this workspace. These only affect your view." },
};

export function SettingsPage({ projects: initialProjects, user }: SettingsPageProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [selectedProject, setSelectedProject] = useState<Project | null>(initialProjects[0] ?? null);
  const [activeSection, setActiveSection] = useState("styles");
  const router = useRouter();

  function handleProjectCreated(project: Project & { _count?: { tweets: number; styles: number } }) {
    const p = { ...project, _count: project._count || { tweets: 0, styles: 0 } };
    setProjects((prev) => [p, ...prev]);
    setSelectedProject(p);
  }

  function handleProjectDeleted(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (selectedProject?.id === id) {
      setSelectedProject(projects.find((p) => p.id !== id) ?? null);
    }
  }

  function handleProjectUpdated(updated: Project) {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
    if (selectedProject?.id === updated.id) {
      setSelectedProject({ ...selectedProject, ...updated });
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
            {activeSection === "styles" && selectedProject && <ImageStylesPanel project={selectedProject} projects={projects} onSwitchProject={(p) => setSelectedProject(p)} />}
            {activeSection === "accounts" && <AccountsPanel projects={projects} onDelete={handleProjectDeleted} onUpdate={handleProjectUpdated} />}
            {activeSection === "appearance" && <AppearancePanel />}
          </div>
        </main>
      </div>
    </div>
  );
}
