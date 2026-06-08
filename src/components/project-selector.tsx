"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Project {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  _count: { tweets: number };
}

interface ProjectSelectorProps {
  projects: Project[];
  selected: Project | null;
  onSelect: (project: Project) => void;
  onCreated: (project: Project) => void;
}

export function ProjectSelector({ projects, selected, onSelect, onCreated }: ProjectSelectorProps) {
  const [open, setOpen] = useState(false);
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
      setOpen(false);
      setName("");
      setHandle("");
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selected?.id ?? ""}
        onValueChange={(id) => {
          const p = projects.find((p) => p.id === id);
          if (p) onSelect(p);
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select project" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              @{p.handle}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background px-3 h-8 hover:bg-accent hover:text-accent-foreground">
          + New
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Twitter Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My SaaS Product"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-handle">Twitter Handle</Label>
              <Input
                id="project-handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="mysaas"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
