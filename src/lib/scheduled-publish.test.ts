import assert from "node:assert/strict";
import test from "node:test";
import { publishDueScheduledPosts } from "./scheduled-publish.ts";

test("publishDueScheduledPosts publishes due scheduled posts in ascending schedule order", async () => {
  const now = new Date("2026-06-15T12:00:00.000Z");
  const calls: Array<{ tweetId: string; userId: string }> = [];
  const findManyCalls: unknown[] = [];
  const db = {
    tweet: {
      findMany: async (args: unknown) => {
        findManyCalls.push(args);
        return [
          { id: "tweet-1", project: { userId: "user-1" } },
          { id: "tweet-2", project: { userId: "user-2" } },
        ];
      },
    },
  };
  const publish = async (tweetId: string, userId: string) => {
    calls.push({ tweetId, userId });
    return tweetId === "tweet-2"
      ? { ok: false as const, status: 502, error: "X rejected the post" }
      : { ok: true as const, tweet: { id: tweetId } };
  };

  const result = await publishDueScheduledPosts(now, db, publish);

  assert.deepEqual(findManyCalls, [
    {
      where: {
        status: "SCHEDULED",
        scheduledAt: { lte: now },
        externalPostId: null,
      },
      include: { project: true },
      orderBy: { scheduledAt: "asc" },
      take: 20,
    },
  ]);
  assert.deepEqual(calls, [
    { tweetId: "tweet-1", userId: "user-1" },
    { tweetId: "tweet-2", userId: "user-2" },
  ]);
  assert.deepEqual(result, {
    processed: 2,
    results: [
      { tweetId: "tweet-1", ok: true, error: null },
      { tweetId: "tweet-2", ok: false, error: "X rejected the post" },
    ],
  });
});
