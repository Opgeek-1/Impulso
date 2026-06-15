"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";

interface SchedulePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (date: Date) => void;
  tweetContent: string;
  initialDate?: Date;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export function SchedulePickerDialog({
  open,
  onOpenChange,
  onConfirm,
  tweetContent,
  initialDate,
}: SchedulePickerDialogProps) {
  const now = new Date();
  const defaultDate = initialDate ?? now;

  const [selectedDate, setSelectedDate] = useState<Date>(defaultDate);
  const [hour, setHour] = useState<number>(initialDate ? initialDate.getHours() : now.getHours());
  const [minute, setMinute] = useState<number>(
    initialDate ? initialDate.getMinutes() : Math.ceil(now.getMinutes() / 5) * 5 % 60
  );
  const [nowTime, setNowTime] = useState(() => Date.now());

  const scheduledDateTime = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(hour, minute, 0, 0);
    return d;
  }, [selectedDate, hour, minute]);

  const isPast = scheduledDateTime.getTime() < nowTime;

  function handleConfirm() {
    onConfirm(scheduledDateTime);
    onOpenChange(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) setNowTime(Date.now());
    onOpenChange(nextOpen);
  }

  function fmtHour(h: number) {
    const ap = h >= 12 ? "PM" : "AM";
    const hh = h % 12 || 12;
    return `${hh} ${ap}`;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon size={18} />
            Schedule Post
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Preview */}
          <div
            className="rounded-lg p-3 text-[12.5px] leading-relaxed line-clamp-3"
            style={{
              background: "var(--imp-surface-2, hsl(var(--muted)))",
              color: "var(--imp-text-2, hsl(var(--muted-foreground)))",
              border: "1px solid var(--imp-border, hsl(var(--border)))",
            }}
          >
            {tweetContent}
          </div>

          {/* Summary line */}
          <div
            className="flex items-center gap-2 text-[13px] font-medium"
            style={{ color: isPast ? "#f43f5e" : "var(--imp-accent, hsl(var(--primary)))" }}
          >
            <Clock size={14} />
            {isPast
              ? "Time is in the past"
              : `Will send on ${format(scheduledDateTime, "EEE, MMM d, yyyy")} at ${format(scheduledDateTime, "h:mm a")}`}
          </div>

          {/* Calendar */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              disabled={{ before: new Date() }}
            />
          </div>

          {/* Time selectors */}
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "var(--imp-text-2, hsl(var(--muted-foreground)))" }}>
              Time
            </label>
            <div className="flex items-center gap-2">
              <Select value={String(hour)} onValueChange={(v) => setHour(Number(v))}>
                <SelectTrigger className="flex-1">
                  <SelectValue>{fmtHour(hour)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {fmtHour(h)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-[14px] font-bold" style={{ color: "var(--imp-muted, hsl(var(--muted-foreground)))" }}>:</span>
              <Select value={String(minute)} onValueChange={(v) => setMinute(Number(v))}>
                <SelectTrigger className="flex-1">
                  <SelectValue>{String(minute).padStart(2, "0")}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {MINUTES.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {String(m).padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isPast}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
