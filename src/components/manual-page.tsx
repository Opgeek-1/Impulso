"use client";

import { useState } from "react";
import { TopNav } from "@/components/top-nav";
import { ManualPanel } from "@/components/manual-panel";

interface Project {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  avatarUrl?: string | null;
  _count: { tweets: number };
}

interface ManualPageProps {
  projects: Project[];
  user: { id?: string; name?: string | null; email?: string | null; avatarSeed?: string | null };
}

export function ManualPage({ projects, user }: ManualPageProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(projects[0] ?? null);

  function handleProjectCreated(project: Project) {
    setSelectedProject(project);
  }

  return (
    <div className="flex h-screen flex-col">
      <TopNav
        projects={projects}
        selected={selectedProject}
        onSelect={setSelectedProject}
        onCreated={handleProjectCreated}
        user={user}
      />
      <main className="min-h-0 flex-1 overflow-auto">
        <ManualPanel />
      </main>
    </div>
  );
}
