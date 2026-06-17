"use client";

import { useState } from "react";
import { BloomAvatar } from "@/components/ui/bloom-avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check } from "lucide-react";
import { toast } from "sonner";

const AVATAR_SEEDS = [
  "aurora", "breeze", "coral", "dusk", "ember", "flora",
  "grove", "haze", "iris", "jade", "kite", "luna",
  "mist", "nova", "opal", "pine", "quartz", "rain",
  "sage", "tide", "umbra", "vine", "wave", "zephyr",
];

interface AvatarPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSeed: string;
  onPicked: (seed: string) => void;
}

export function AvatarPicker({ open, onOpenChange, currentSeed, onPicked }: AvatarPickerProps) {
  const [selected, setSelected] = useState(currentSeed);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/user/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarSeed: selected }),
      });
      if (res.ok) {
        onPicked(selected);
        onOpenChange(false);
      } else {
        toast.error("Failed to save avatar");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Choose your avatar</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-6 gap-3 py-3">
          {AVATAR_SEEDS.map((seed) => (
            <button
              key={seed}
              onClick={() => setSelected(seed)}
              className="relative rounded-full transition-transform hover:scale-110 focus:outline-none"
              style={{ transform: selected === seed ? "scale(1.1)" : undefined }}
            >
              <BloomAvatar seed={seed} size={48} />
              {selected === seed && (
                <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/30">
                  <Check size={18} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={() => onOpenChange(false)}
            className="px-3.5 py-1.5 text-[13px] font-medium rounded-lg transition-colors"
            style={{ color: "var(--imp-text-2)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 text-[13px] font-semibold rounded-lg text-white transition-colors disabled:opacity-50"
            style={{ background: "var(--imp-accent)" }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
