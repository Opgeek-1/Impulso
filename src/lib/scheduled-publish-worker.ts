import { publishDueScheduledPosts } from "@/lib/scheduled-publish";

const DEFAULT_INTERVAL_MS = 60_000;

type WorkerState = {
  timer?: NodeJS.Timeout;
  running: boolean;
};

const globalForScheduler = globalThis as typeof globalThis & {
  impulsoScheduledPublishWorker?: WorkerState;
};

function parseIntervalMs() {
  const raw = process.env.SCHEDULED_PUBLISH_INTERVAL_MS;
  if (!raw) return DEFAULT_INTERVAL_MS;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 10_000 ? value : DEFAULT_INTERVAL_MS;
}

function shouldStartScheduledPublishWorker() {
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== "nodejs") return false;
  if (process.env.SCHEDULED_PUBLISH_WORKER === "false") return false;
  if (process.env.VERCEL === "1" && process.env.SCHEDULED_PUBLISH_WORKER !== "true") return false;
  return process.env.NODE_ENV === "production" || process.env.SCHEDULED_PUBLISH_WORKER === "true";
}

async function tick(state: WorkerState) {
  if (state.running) return;
  state.running = true;
  try {
    const result = await publishDueScheduledPosts();
    if (result.processed > 0) {
      console.info("[scheduled-publish] processed due posts", result);
    }
  } catch (err) {
    console.error("[scheduled-publish] worker tick failed", err);
  } finally {
    state.running = false;
  }
}

export function startScheduledPublishWorker() {
  if (!shouldStartScheduledPublishWorker()) return;

  const existing = globalForScheduler.impulsoScheduledPublishWorker;
  if (existing?.timer) return;

  const state: WorkerState = existing || { running: false };
  const intervalMs = parseIntervalMs();
  state.timer = setInterval(() => {
    void tick(state);
  }, intervalMs);
  state.timer.unref?.();
  globalForScheduler.impulsoScheduledPublishWorker = state;

  void tick(state);
  console.info(`[scheduled-publish] worker started, interval=${intervalMs}ms`);
}
