"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ChevronLeft,
  Users,
  Mail,
  Trash2,
  Key,
  Crown,
  Clock,
  Link2,
  Check,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  avatarUrl?: string | null;
  _count: { tweets: number; styles?: number };
}

interface Member {
  id: string;
  role: string;
  lastActive: string;
  user: { id: string; name: string | null; email: string; image: string | null };
}

interface Invite {
  id: string;
  token: string;
  role: string;
  expiresAt: string | null;
  createdAt: string;
}

interface Workspace {
  id: string;
  name: string;
  domain: string | null;
  plan: string;
  seats: number;
  members: Member[];
  invites: Invite[];
}

interface TeamPageProps {
  projects: Project[];
  user: { id?: string; name?: string | null; email?: string | null };
}

const AVATAR_COLORS = ["#334155", "#0ea5e9", "#FE3C9C", "#22c55e", "#f59e0b", "#6366f1", "#a855f7"];

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Active now";
  if (mins < 60) return `Active ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Active ${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Active yesterday";
  return `Active ${days}d ago`;
}

export function TeamPage({ projects, user }: TeamPageProps) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(projects[0] ?? null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      const res = await fetch("/api/workspace");
      if (cancelled) return;
      if (res.ok) setWorkspace(await res.json());
      setLoading(false);
    }

    void loadWorkspace();
    return () => {
      cancelled = true;
    };
  }, []);

  const isOwner = workspace?.members.find((m) => m.user.id === user.id)?.role === "owner";

  async function handleInvite() {
    if (!workspace) return;
    setInviting(true);
    const res = await fetch("/api/workspace/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: workspace.id }),
    });
    if (res.ok) {
      const invite = await res.json();
      setWorkspace({ ...workspace, invites: [...workspace.invites, invite] });
      const link = `${window.location.origin}/invite/${invite.token}`;
      navigator.clipboard.writeText(link);
      setCopiedToken(invite.token);
      setTimeout(() => setCopiedToken(null), 3000);
      toast.success("Invite link created and copied");
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to create invite link");
    }
    setInviting(false);
  }

  function copyInviteLink(token: string) {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 3000);
    toast.success("Invite link copied!");
  }

  async function handleRemoveMember(memberId: string) {
    if (!workspace) return;
    const res = await fetch(`/api/workspace/members?memberId=${memberId}`, { method: "DELETE" });
    if (res.ok) {
      setWorkspace({ ...workspace, members: workspace.members.filter((m) => m.id !== memberId) });
      toast.success("Member removed");
    }
  }

  async function handleRemoveInvite(inviteId: string) {
    if (!workspace) return;
    const res = await fetch(`/api/workspace/invite?inviteId=${inviteId}`, { method: "DELETE" });
    if (res.ok) {
      setWorkspace({ ...workspace, invites: workspace.invites.filter((i) => i.id !== inviteId) });
      toast.success("Invite cancelled");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <TopNav projects={projects} selected={selectedProject} onSelect={setSelectedProject} onCreated={() => {}} user={user} />
        <div className="flex-1 flex items-center justify-center" style={{ color: "var(--imp-muted)" }}>Loading workspace...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <TopNav projects={projects} selected={selectedProject} onSelect={setSelectedProject} onCreated={() => {}} user={user} />

      <main className="flex-1 overflow-auto">
        <div className="max-w-[680px] mx-auto px-6 py-8">
          {/* Back link */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-[13px] font-medium mb-6 transition-colors hover:text-[var(--imp-accent)]"
            style={{ color: "var(--imp-text-2)" }}
          >
            <ChevronLeft size={14} /> Back to pipeline
          </button>

          {/* Workspace card */}
          {workspace && (
            <div
              className="rounded-2xl px-6 py-5 mb-8 flex items-center gap-5"
              style={{ background: "var(--imp-surface)", border: "1px solid var(--imp-border)" }}
            >
              <div
                className="w-[56px] h-[56px] rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--imp-accent-soft)", color: "var(--imp-accent)" }}
              >
                <Users size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-[20px] font-bold m-0" style={{ color: "var(--imp-text)" }}>{workspace.name}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  {workspace.domain && <span className="text-[13px]" style={{ color: "var(--imp-muted)" }}>{workspace.domain}</span>}
                  {workspace.domain && <span style={{ color: "var(--imp-faint)" }}>·</span>}
                  <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold" style={{ color: "var(--imp-accent)" }}>
                    <Crown size={11} /> {workspace.plan.charAt(0).toUpperCase() + workspace.plan.slice(1)} plan
                  </span>
                </div>
              </div>
              <div className="flex gap-6 text-center shrink-0">
                <div>
                  <div className="text-[20px] font-bold" style={{ color: "var(--imp-text)" }}>{workspace.members.length}</div>
                  <div className="text-[11px]" style={{ color: "var(--imp-muted)" }}>Members</div>
                </div>
                <div>
                  <div className="text-[20px] font-bold" style={{ color: "var(--imp-text)" }}>{workspace.invites.length}</div>
                  <div className="text-[11px]" style={{ color: "var(--imp-muted)" }}>Pending</div>
                </div>
                <div>
                  <div className="text-[20px] font-bold" style={{ color: "var(--imp-text)" }}>{workspace.seats}</div>
                  <div className="text-[11px]" style={{ color: "var(--imp-muted)" }}>Seats</div>
                </div>
              </div>
            </div>
          )}

          {/* Invite section */}
          {isOwner && (
            <div className="mb-8">
              <h2 className="text-[16px] font-bold mb-1" style={{ color: "var(--imp-text)" }}>Invite people</h2>
              <p className="text-[13.5px] mb-4" style={{ color: "var(--imp-muted)" }}>
                Create a single-use link for someone to join this workspace with their own account.
              </p>
              <Button onClick={handleInvite} className="imp-btn-primary h-[48px] px-5 rounded-xl text-[13.5px] gap-2" disabled={inviting}>
                <Link2 size={14} /> {inviting ? "Creating..." : "Create invite link"}
              </Button>
              <div className="flex items-center gap-2 mt-3 px-1">
                <Key size={13} style={{ color: "var(--imp-muted)" }} />
                <span className="text-[12.5px]" style={{ color: "var(--imp-muted)" }}>
                  <strong style={{ color: "var(--imp-text-2)" }}>One permission level.</strong> Links expire after 7 days and can be used once.
                </span>
              </div>
            </div>
          )}

          {/* Members list */}
          {workspace && workspace.members.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[16px] font-bold" style={{ color: "var(--imp-text)" }}>Members</h2>
                <span className="text-[12px] font-mono" style={{ color: "var(--imp-muted)" }}>{workspace.members.length} active</span>
              </div>
              <div className="flex flex-col gap-2">
                {workspace.members.map((m, i) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3.5 rounded-xl px-5 py-3.5 imp-row"
                    style={{ background: "var(--imp-surface)", border: "1px solid var(--imp-border)" }}
                  >
                    <div
                      className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-[14px] font-bold text-white shrink-0"
                      style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                    >
                      {(m.user.name || m.user.email)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold" style={{ color: "var(--imp-text)" }}>{m.user.name || m.user.email.split("@")[0]}</span>
                        {m.user.id === user.id && (
                          <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "var(--imp-surface-3)", color: "var(--imp-muted)" }}>You</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--imp-muted)" }}>
                        <span>{m.user.email}</span>
                        <span>·</span>
                        <span>{timeAgo(m.lastActive)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 text-[11.5px] font-semibold px-2.5 py-1 rounded-lg"
                        style={{
                          background: m.role === "owner" ? "var(--imp-accent-soft)" : "var(--imp-surface-3)",
                          color: m.role === "owner" ? "var(--imp-accent)" : "var(--imp-text-2)",
                        }}
                      >
                        {m.role === "owner" ? <Crown size={11} /> : <Users size={11} />}
                        {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                      </span>
                      {isOwner && m.role !== "owner" && (
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          className="imp-icon-btn w-7 h-7 flex items-center justify-center"
                          style={{ color: "var(--imp-muted)" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending invites */}
          {workspace && workspace.invites.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[16px] font-bold" style={{ color: "var(--imp-text)" }}>Pending invites</h2>
                <span className="text-[12px] font-mono" style={{ color: "var(--imp-muted)" }}>{workspace.invites.length} waiting</span>
              </div>
              <div className="flex flex-col gap-2">
                {workspace.invites.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center gap-3.5 rounded-xl px-5 py-3.5 imp-row"
                    style={{ background: "var(--imp-surface)", border: "1px solid var(--imp-border)" }}
                  >
                    <div
                      className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-[14px] font-bold text-white shrink-0"
                      style={{ background: "#94a3b8" }}
                    >
                      <Mail size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[14px] font-semibold" style={{ color: "var(--imp-text)" }}>Invite link</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "var(--s-image-bg)", color: "var(--s-image)" }}>
                          <Clock size={9} /> Invite pending
                        </span>
                        <span className="text-[11.5px]" style={{ color: "var(--imp-muted)" }}>
                          {inv.expiresAt ? `Expires ${new Date(inv.expiresAt).toLocaleDateString()}` : "Waiting to accept"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: "var(--imp-surface-3)", color: "var(--imp-text-2)" }}>
                        <Users size={11} /> Member
                      </span>
                      <button
                        onClick={() => copyInviteLink(inv.token)}
                        className="imp-icon-btn w-7 h-7 flex items-center justify-center"
                        title="Copy invite link"
                        style={{ color: copiedToken === inv.token ? "var(--imp-accent)" : "var(--imp-muted)" }}
                      >
                        {copiedToken === inv.token ? <Check size={14} /> : <Link2 size={14} />}
                      </button>
                      {isOwner && (
                        <button
                          onClick={() => handleRemoveInvite(inv.id)}
                          className="imp-icon-btn w-7 h-7 flex items-center justify-center"
                          style={{ color: "var(--imp-muted)" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
