import { prisma } from "@/lib/db";
import { getWorkspaceMemberIds } from "@/lib/workspace";
import { createXPost, refreshXAccessToken, uploadXImage } from "@/lib/x-api";

type PublishResult =
  | { ok: true; tweet: Awaited<ReturnType<typeof prisma.tweet.update>> }
  | { ok: false; status: number; error: string };

export type XConnectionStatus = { connected: boolean; username: string | null };

function publicError(message: string) {
  return message.length > 240 ? `${message.slice(0, 237)}...` : message;
}

function tokenExpiresSoon(expiresAt: number | null) {
  if (!expiresAt) return false;
  return expiresAt <= Math.floor(Date.now() / 1000) + 300;
}

async function getXAccessToken(providerAccountId: string | null) {
  if (!providerAccountId) return null;

  const account = await prisma.account.findFirst({
    where: { provider: "twitter", providerAccountId },
  });

  if (!account?.access_token) return null;
  if (!tokenExpiresSoon(account.expires_at)) return account.access_token;
  if (!account.refresh_token || !process.env.AUTH_TWITTER_ID || !process.env.AUTH_TWITTER_SECRET) {
    return account.access_token;
  }

  const refreshed = await refreshXAccessToken(
    account.refresh_token,
    process.env.AUTH_TWITTER_ID,
    process.env.AUTH_TWITTER_SECRET
  );

  await prisma.account.update({
    where: { provider_providerAccountId: { provider: "twitter", providerAccountId } },
    data: {
      access_token: refreshed.accessToken,
      refresh_token: refreshed.refreshToken,
      ...(refreshed.expiresAt && { expires_at: refreshed.expiresAt }),
    },
  });

  return refreshed.accessToken;
}

async function markMissingConnection(tweetId: string, handle: string) {
  const message = await markPublishFailure(tweetId, `Connect X for @${handle} before publishing`);
  return { ok: false as const, status: 400, error: message };
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

export async function getXConnectionMap(userId: string): Promise<Record<string, XConnectionStatus>> {
  const projects = await prisma.project.findMany({
    where: { userId },
    select: { id: true, xProviderAccountId: true, xUsername: true },
  });
  const providerAccountIds = projects.flatMap((project) => project.xProviderAccountId ? [project.xProviderAccountId] : []);
  const accounts = providerAccountIds.length
    ? await prisma.account.findMany({
        where: { provider: "twitter", providerAccountId: { in: providerAccountIds }, access_token: { not: null } },
        select: { providerAccountId: true },
      })
    : [];
  const connected = new Set(accounts.map((account) => account.providerAccountId));

  return Object.fromEntries(
    projects.map((project) => [
      project.id,
      {
        connected: Boolean(project.xProviderAccountId && connected.has(project.xProviderAccountId)),
        username: project.xUsername,
      },
    ])
  );
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

  let accessToken: string | null;
  try {
    accessToken = await getXAccessToken(tweet.project.xProviderAccountId);
  } catch (err) {
    const message = await markPublishFailure(tweet.id, err instanceof Error ? err.message : "X token refresh failed");
    return { ok: false, status: 502, error: message };
  }

  if (!accessToken) {
    return markMissingConnection(tweet.id, tweet.project.handle);
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
