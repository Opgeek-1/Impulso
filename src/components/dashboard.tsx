"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TopNav } from "@/components/top-nav";
import { GeneratePanel } from "@/components/generate-panel";
import { CuratePanel } from "@/components/curate-panel";
import { SchedulePanel } from "@/components/schedule-panel";
import { StylesPanel } from "@/components/styles-panel";
import { Sparkles, Columns3, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";

interface Project {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  avatarUrl?: string | null;
  _count: { tweets: number };
}

interface DashboardProps {
  projects: Project[];
  user: { id?: string; name?: string | null; email?: string | null };
}

const TABS = [
  { id: "generate", n: 1, labelKey: "generate", icon: Sparkles },
  { id: "curate", n: 2, labelKey: "curate", icon: Columns3 },
  { id: "schedule", n: 3, labelKey: "schedule", icon: Calendar },
];

function StageTabs({ active, setActive, counts }: {
  active: string;
  setActive: (id: string) => void;
  counts: Record<string, number | null>;
}) {
  const t = useTranslations("dashboard.tabs");

  return (
    <div
      className="flex items-center px-6 pt-3 gap-1"
      style={{ borderBottom: "1px solid var(--imp-border)" }}
    >
      {TABS.map((tab) => {
        const on = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className="imp-tab relative flex items-center gap-2 px-3.5 py-2.5 pb-3 bg-transparent border-none"
            style={{ color: on ? "var(--imp-text)" : "var(--imp-muted)", fontSize: "13.5px", fontWeight: 600 }}
          >
            {/* Number badge */}
            <span
              className="flex items-center justify-center w-[22px] h-[22px] rounded-[7px] text-[11.5px] font-bold"
              style={{
                background: on ? "var(--imp-accent-grad)" : "var(--imp-surface-3)",
                color: on ? "var(--imp-on-accent)" : "var(--imp-muted)",
                border: on ? "none" : "1px solid var(--imp-border-2)",
                boxShadow: on ? "0 2px 8px -3px var(--imp-accent-glow)" : "none",
              }}
            >
              {tab.n}
            </span>
            <span>{t(tab.labelKey)}</span>
            {/* Count badge */}
            {counts[tab.id] != null && (
              <span
                className="font-mono text-[11px] rounded-full px-[7px] py-px"
                style={{
                  color: on ? "var(--imp-accent)" : "var(--imp-faint)",
                  background: on ? "var(--imp-accent-soft)" : "transparent",
                }}
              >
                {counts[tab.id]}
              </span>
            )}
            {/* Active underline */}
            {on && (
              <span
                className="absolute left-2 right-2 bottom-[-1px] h-[2.5px] rounded-full"
                style={{ background: "var(--imp-accent-grad)" }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

const VALID_TAB_IDS = new Set(TABS.map((t) => t.id));

function buildQs(params: URLSearchParams) {
  const qs = params.toString();
  return qs ? `/dashboard?${qs}` : "/dashboard";
}

export function Dashboard({ projects: initialProjects, user }: DashboardProps) {
  const t = useTranslations("dashboard");
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

  const setSelectedProject = useCallback((project: Project | null) => {
    setSelectedProjectState(project);
    const params = new URLSearchParams(searchParams.toString());
    if (!project || project.handle === initialProjects[0]?.handle) {
      params.delete("account");
    } else {
      params.set("account", project.handle);
    }
    router.replace(buildQs(params), { scroll: false });
  }, [searchParams, router, initialProjects]);

  const tabParam = searchParams.get("tab");
  const activeTab = tabParam && VALID_TAB_IDS.has(tabParam) ? tabParam : "generate";

  const setActiveTab = useCallback((id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id === "generate") {
      params.delete("tab");
    } else {
      params.set("tab", id);
    }
    router.replace(buildQs(params), { scroll: false });
  }, [searchParams, router]);

  const [counts, setCounts] = useState<Record<string, number | null>>({ generate: null, curate: null, schedule: null });

  const fetchCounts = useCallback(async (projectId: string) => {
    const res = await fetch(`/api/tweets?projectId=${projectId}`);
    if (!res.ok) return null;
    const tweets = await res.json();
    return {
      generate: tweets.filter((t: { status: string }) => t.status === "DRAFT").length || null,
      curate: tweets.filter((t: { status: string }) => ["DRAFT", "CURATED", "DESIGNED", "IMAGE_GENERATED"].includes(t.status)).length || null,
      schedule: tweets.filter((t: { status: string }) => t.status === "SCHEDULED").length || null,
    };
  }, []);

  async function refreshCounts() {
    if (!selectedProject) return;
    const nextCounts = await fetchCounts(selectedProject.id);
    if (nextCounts) setCounts(nextCounts);
  }

  useEffect(() => {
    if (!selectedProject) return;
    let cancelled = false;

    async function loadCounts() {
      const nextCounts = await fetchCounts(selectedProject!.id);
      if (!cancelled && nextCounts) setCounts(nextCounts);
    }

    void loadCounts();
    return () => {
      cancelled = true;
    };
  }, [fetchCounts, selectedProject]);

  function handleProjectCreated(project: Project) {
    setProjects((prev) => [project, ...prev]);
    setSelectedProjectState(project);
    const params = new URLSearchParams(searchParams.toString());
    params.set("account", project.handle);
    router.replace(buildQs(params), { scroll: false });
  }

  return (
    <div className="flex flex-col h-screen">
      <TopNav
        projects={projects}
        selected={selectedProject}
        onSelect={setSelectedProject}
        onCreated={handleProjectCreated}
        user={user}
      />

      <main className="flex-1 overflow-hidden flex flex-col min-h-0">
        {selectedProject ? (
          <>
            <StageTabs active={activeTab} setActive={setActiveTab} counts={counts} />
            <div className="flex-1 overflow-auto min-h-0">
              {activeTab === "generate" && (
                <GeneratePanel project={selectedProject} onComplete={() => { setActiveTab("curate"); void refreshCounts(); }} />
              )}
              {activeTab === "curate" && (
                <CuratePanel project={selectedProject} onComplete={() => { setActiveTab("schedule"); void refreshCounts(); }} onCountChange={() => void refreshCounts()} />
              )}
              {activeTab === "schedule" && (
                <SchedulePanel project={selectedProject} />
              )}
              {activeTab === "styles" && (
                <div className="p-6">
                  <StylesPanel project={selectedProject} />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full" style={{ color: "var(--imp-muted)" }}>
            {t("empty")}
          </div>
        )}
      </main>
    </div>
  );
}
