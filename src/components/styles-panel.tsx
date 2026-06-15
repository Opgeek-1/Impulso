"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  handle: string;
}

interface Style {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
}

interface StylesPanelProps {
  project: Project;
}

export function StylesPanel({ project }: StylesPanelProps) {
  const t = useTranslations("styles_panel");
  const tc = useTranslations("common");
  const ts = useTranslations("settings");
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editContent, setEditContent] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newContent, setNewContent] = useState("");

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
      body: JSON.stringify({
        projectId: project.id,
        name: newName,
        content: newContent,
        isDefault: styles.length === 0,
      }),
    });
    if (res.ok) {
      const style = await res.json();
      setStyles((prev) => [...prev, style]);
      setNewName("");
      setNewContent("");
      setShowNew(false);
      toast.success(ts("style_created"));
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
      toast.success(ts("style_updated"));
    }
  }

  async function handleSetDefault(styleId: string) {
    const res = await fetch("/api/styles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ styleId, isDefault: true }),
    });
    if (res.ok) {
      setStyles((prev) =>
        prev.map((s) => ({ ...s, isDefault: s.id === styleId }))
      );
      toast.success(ts("default_style_updated"));
    }
  }

  async function handleDelete(styleId: string) {
    const res = await fetch(`/api/styles?styleId=${styleId}`, { method: "DELETE" });
    if (res.ok) {
      setStyles((prev) => prev.filter((s) => s.id !== styleId));
      toast.success(ts("style_deleted"));
    }
  }

  if (loading) return <p className="text-muted-foreground">{t("loading")}</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("subtitle", { handle: project.handle })}
        </p>
      </div>

      {styles.map((style) => (
        <Card key={style.id}>
          <CardContent className="py-4 space-y-3">
            {editingId === style.id ? (
              <div className="space-y-3">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={t("style_name")}
                />
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleUpdate(style.id)}>{tc("save")}</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>{tc("cancel")}</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{style.name}</h3>
                    {style.isDefault && <Badge variant="secondary">{ts("default")}</Badge>}
                  </div>
                  <div className="flex gap-2">
                    {!style.isDefault && (
                      <Button size="sm" variant="ghost" onClick={() => handleSetDefault(style.id)}>
                        {t("set_as_default")}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setEditingId(style.id); setEditName(style.name); setEditContent(style.content); }}
                    >
                      {tc("edit")}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(style.id)}>
                      {tc("delete")}
                    </Button>
                  </div>
                </div>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48 whitespace-pre-wrap">
                  {style.content}
                </pre>
              </>
            )}
          </CardContent>
        </Card>
      ))}

      {showNew ? (
        <Card>
          <CardContent className="py-4 space-y-3">
            <Label>{t("style_name")}</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. PayGate推文配图标准"
            />
            <Label>{t("style_description")}</Label>
            <Textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={12}
              className="font-mono text-sm"
              placeholder={t("style_placeholder")}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate}>{tc("create")}</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowNew(false)}>{tc("cancel")}</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" onClick={() => setShowNew(true)}>
          {t("add_style")}
        </Button>
      )}
    </div>
  );
}
