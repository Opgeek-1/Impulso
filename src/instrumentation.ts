export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduledPublishWorker } = await import("@/lib/scheduled-publish-worker");
    startScheduledPublishWorker();
  }
}
