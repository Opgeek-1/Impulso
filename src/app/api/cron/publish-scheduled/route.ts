import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publishTweet } from "@/lib/x-publish";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await prisma.tweet.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: new Date() },
      externalPostId: null,
    },
    include: { project: true },
    orderBy: { scheduledAt: "asc" },
    take: 20,
  });

  const results = [];
  for (const tweet of due) {
    const result = await publishTweet(tweet.id, tweet.project.userId);
    results.push({
      tweetId: tweet.id,
      ok: result.ok,
      error: result.ok ? null : result.error,
    });
  }

  return NextResponse.json({ processed: results.length, results });
}
