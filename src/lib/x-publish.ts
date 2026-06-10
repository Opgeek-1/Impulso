import { prisma } from "@/lib/db";
import { getWorkspaceMemberIds } from "@/lib/workspace";
import { createXPost, uploadXImage } from "@/lib/x-api";

type PublishResult =
  | { ok: true; tweet: Awaited<ReturnType<typeof prisma.tweet.update>> }
  | { ok: false; status: number; error: string };

function publicError(message: string) {
  return message.length > 240 ? `${message.slice(0, 237)}...` : message;
}

async function getXAccessToken(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "twitter" },
    orderBy: { expires_at: "desc" },
  });

  if (!account?.access_token) return null;
  return account.access_token;
}

async function markPublishFailure(tweetId: string, error: string) {
  const message = publicError(error);
  await prisma.tweet.update({
    where: { id: tweetId },
    data: {
      status: "PUBLISH_FAILED",
      publishError: message,
      publishAttempts: { increment: 1 },
      lastPublishAttemptAt: new Date(),
    },
  });
  return message;
}

export async function hasXConnection(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "twitter", access_token: { not: null } },
    select: { providerAccountId: true },
  });
  return Boolean(account);
}

export async function publishTweet(tweetId: string, userId: string): Promise<PublishResult> {
  const memberIds = await getWorkspaceMemberIds(userId);
  const tweet = await prisma.tweet.findFirst({
    where: { id: tweetId },
    include: { project: true },
  });

  if (!tweet || !memberIds.includes(tweet.project.userId)) {
    return { ok: false, status: 404, error: "Tweet not found" };
  }

  if (tweet.externalPostId) {
    return { ok: false, status: 409, error: "Tweet has already been posted" };
  }

  const accessToken = await getXAccessToken(userId);
  if (!accessToken) {
    return { ok: false, status: 400, error: "Connect X before publishing" };
  }

  const claimed = await prisma.tweet.updateMany({
    where: {
      id: tweetId,
      externalPostId: null,
      status: { in: ["CURATED", "DESIGNED", "IMAGE_GENERATED", "SCHEDULED", "PUBLISH_FAILED"] },
    },
    data: {
      status: "PUBLISHING",
      publishError: null,
      lastPublishAttemptAt: new Date(),
    },
  });

  if (claimed.count !== 1) {
    return { ok: false, status: 409, error: "Tweet is not publishable" };
  }

  try {
    const mediaId = tweet.imageUrl ? await uploadXImage(tweet.imageUrl, accessToken) : null;
    const externalPostId = await createXPost(tweet.content, mediaId, accessToken);
    const updated = await prisma.tweet.update({
      where: { id: tweetId },
      data: {
        status: "POSTED",
        externalPostId,
        publishedAt: new Date(),
        publishError: null,
        publishAttempts: { increment: 1 },
        lastPublishAttemptAt: new Date(),
      },
    });

    return { ok: true, tweet: updated };
  } catch (err) {
    const message = await markPublishFailure(tweetId, err instanceof Error ? err.message : "Publish failed");
    return { ok: false, status: 502, error: message };
  }
}
