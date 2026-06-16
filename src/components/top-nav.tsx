"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sun,
  Moon,
  ChevronDown,
  Plus,
  LogOut,
  Settings,
  Check,
  Bell,
  Users,
  BookOpen,
  ArrowLeft,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  avatarUrl?: string | null;
  _count: { tweets: number };
}

interface TopNavProps {
  projects: Project[];
  selected: Project | null;
  onSelect: (project: Project) => void;
  onCreated: (project: Project) => void;
  user: { id?: string; name?: string | null; email?: string | null };
}

export function TopNav({ projects, selected, onSelect, onCreated, user }: TopNavProps) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");
  const common = useTranslations("common");
  const [newOpen, setNewOpen] = useState(false);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, handle }),
    });
    if (res.ok) {
      const project = await res.json();
      onCreated({ ...project, _count: { tweets: 0 } });
      setNewOpen(false);
      setName("");
      setHandle("");
    }
    setLoading(false);
  }

  const showBackToPipeline = pathname !== "/";

  return (
    <>
      <header
        className="flex items-center justify-between h-[60px] px-[22px] shrink-0 border-b relative z-50"
        style={{
          borderColor: "var(--imp-border)",
          background: "color-mix(in srgb, var(--imp-surface) 72%, transparent)",
          backdropFilter: "blur(14px)",
        }}
      >
        {/* Left: logo + account switcher */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--imp-accent)]"
            aria-label="Impulso"
          >
            <Image
              src={theme === "dark" ? "/tomo-mark.png" : "/tomo-mark-color.png"}
              alt="Impulso"
              width={34}
              height={34}
              className="object-contain"
              style={{ filter: "drop-shadow(0 3px 8px var(--imp-accent-glow))" }}
            />
            <span className="text-[16.5px] font-bold" style={{ color: "var(--imp-text)", letterSpacing: "-0.02em" }}>
              Impulso
            </span>
          </Link>

          <div className="w-px h-[26px]" style={{ background: "var(--imp-border-2)" }} />

          {showBackToPipeline && (
            <>
              <Link
                href="/"
                className="flex h-[34px] items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors hover:bg-[var(--imp-hover)] hover:text-[var(--imp-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--imp-accent)]"
                style={{ color: "var(--imp-text-2)" }}
              >
                <ArrowLeft size={14} />
                {common("backToPipeline")}
              </Link>

              <div className="w-px h-[26px]" style={{ background: "var(--imp-border-2)" }} />
            </>
          )}

          {/* Account switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-2.5 h-[38px] pl-2 pr-2.5 rounded-[11px] border transition-all hover:border-[var(--imp-border-strong)] hover:bg-[var(--imp-hover)]"
              style={{
                borderColor: "var(--imp-border-2)",
                background: "var(--imp-surface-2)",
                color: "var(--imp-text)",
              }}
            >
              {selected ? (
                <>
                  {selected.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selected.avatarUrl} alt={selected.name} className="w-6 h-6 object-cover" style={{ borderRadius: "32%" }} />
                  ) : (
                    <div
                      className="w-6 h-6 flex items-center justify-center text-[10px] font-bold"
                      style={{ background: "var(--imp-accent-grad)", color: "var(--imp-on-accent)", borderRadius: "32%" }}
                    >
                      {selected.name[0]}
                    </div>
                  )}
                  <div className="text-left leading-tight">
                    <div className="text-[13px] font-semibold">{selected.name}</div>
                    <div className="text-[11px] font-mono" style={{ color: "var(--imp-muted)" }}>
                      @{selected.handle}
                    </div>
                  </div>
                </>
              ) : (
                <span className="text-[13px]" style={{ color: "var(--imp-muted)" }}>
                  {t("selectAccount")}
                </span>
              )}
              <ChevronDown size={15} style={{ color: "var(--imp-muted)", marginLeft: 2 }} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[268px]">
              <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--imp-faint)" }}>
                {common("accounts")}
              </div>
              {projects.map((p) => (
                <DropdownMenuItem
                  key={p.id}
                  onClick={() => onSelect(p)}
                  className="flex items-center gap-2.5 py-1.5"
                >
                  {p.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.avatarUrl} alt={p.name} className="w-[30px] h-[30px] object-cover shrink-0" style={{ borderRadius: "32%" }} />
                  ) : (
                    <div
                      className="w-[30px] h-[30px] flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: "var(--imp-accent-grad)", color: "var(--imp-on-accent)", borderRadius: "32%" }}
                    >
                      {p.name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 leading-tight">
                    <div className="text-[13px] font-semibold truncate">{p.name}</div>
                    <div className="text-[11px] font-mono" style={{ color: "var(--imp-muted)" }}>
                      @{p.handle}
                    </div>
                  </div>
                  {selected?.id === p.id && (
                    <Check size={15} style={{ color: "var(--imp-accent)" }} />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setNewOpen(true)} className="gap-2.5">
                <Plus size={14} />
                {common("addTwitterAccount")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right: sync pill + theme + bell + settings + user */}
        <div className="flex items-center gap-1.5">
          {/* Workspace synced pill */}
          <div
            className="flex items-center gap-1.5 mr-1 px-[11px] py-[5px] rounded-full"
            style={{ background: "var(--imp-surface-2)", border: "1px solid var(--imp-border)" }}
          >
            <span className="w-[7px] h-[7px] rounded-full" style={{ background: "var(--s-image)", boxShadow: "0 0 7px var(--s-image)" }} />
            <span className="text-[12px] font-medium" style={{ color: "var(--imp-text-2)" }}>{t("workspaceSynced")}</span>
          </div>

          <LanguageSwitcher />

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="imp-icon-btn w-8 h-8 flex items-center justify-center"
            style={{ color: "var(--imp-text-2)" }}
            title={t("toggleTheme")}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            className="imp-icon-btn w-8 h-8 flex items-center justify-center"
            style={{ color: "var(--imp-text-2)" }}
            title={t("notifications")}
          >
            <Bell size={16} />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="rounded-full p-0.5 border ml-0.5"
              style={{ borderColor: "var(--imp-border-2)" }}
            >
              <div
                className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-white text-[13px] font-semibold"
                style={{ background: "linear-gradient(135deg, #334155, #0f172a)" }}
              >
                {user.name?.[0] || user.email?.[0] || "U"}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-2 flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                  style={{ background: "linear-gradient(135deg, #334155, #0f172a)" }}
                >
                  {user.name?.[0] || user.email?.[0] || "U"}
                </div>
                <div className="leading-tight min-w-0">
                  <div className="text-[13px] font-semibold truncate">{user.name || common("user")}</div>
                  <div className="text-[11px] truncate" style={{ color: "var(--imp-muted)" }}>
                    {user.email}
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/team")} className="gap-2">
                <Users size={14} />
                {t("teamWorkspace")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/manual")} className="gap-2">
                <BookOpen size={14} />
                {t("manual")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")} className="gap-2">
                <Settings size={14} />
                {common("settings")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="gap-2 text-red-400">
                <LogOut size={14} />
                {common("signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* New account dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addDialogTitle")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nav-project-name">{t("accountName")}</Label>
              <Input
                id="nav-project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("accountNamePlaceholder")}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nav-project-handle">{t("twitterHandle")}</Label>
              <Input
                id="nav-project-handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value.replace(/^@/, ""))}
                placeholder={t("handlePlaceholder")}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setNewOpen(false)}>
                {common("cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t("adding") : t("addAccount")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
