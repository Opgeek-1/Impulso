type ScheduledTweet = {
  id: string;
  project: { userId: string };
};

type ScheduledPublishDb = {
  tweet: {
    findMany: (args: {
      where: {
        status: "SCHEDULED";
        scheduledAt: { lte: Date };
        externalPostId: null;
      };
      include: { project: true };
      orderBy: { scheduledAt: "asc" };
      take: number;
    }) => Promise<ScheduledTweet[]>;
  };
};

type PublishScheduledPost = (
  tweetId: string,
  userId: string
) => Promise<
  | { ok: true; tweet: unknown }
  | { ok: false; status: number; error: string }
>;

export type ScheduledPublishResult = {
  processed: number;
  results: Array<{
    tweetId: string;
    ok: boolean;
    error: string | null;
  }>;
};

const DEFAULT_BATCH_SIZE = 20;

export async function publishDueScheduledPosts(
  now = new Date(),
  db?: ScheduledPublishDb,
  publish?: PublishScheduledPost
): Promise<ScheduledPublishResult> {
  const resolvedDb = db || (await import("@/lib/db")).prisma;
  const resolvedPublish = publish || (await import("@/lib/x-publish")).publishTweet;
  const due = await resolvedDb.tweet.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: now },
      externalPostId: null,
    },
    include: { project: true },
    orderBy: { scheduledAt: "asc" },
    take: DEFAULT_BATCH_SIZE,
  });

  const results: ScheduledPublishResult["results"] = [];
  for (const tweet of due) {
    const result = await resolvedPublish(tweet.id, tweet.project.userId);
    results.push({
      tweetId: tweet.id,
      ok: result.ok,
      error: result.ok ? null : result.error,
    });
  }

  return { processed: results.length, results };
}
