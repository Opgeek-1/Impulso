import { prisma } from "@/lib/db";
import { getWorkspaceMemberIds } from "@/lib/workspace";
import { createXPost, uploadXImage } from "@/lib/x-api";

type PublishResult =
  | { ok: true; tweet: Awaited<ReturnType<typeof prisma.tweet.update>> }
  | { ok: false; status: number; error: string };

function publicError(message: string) {
  return message.length > 240 ? `${message.slice(0, 237)}...` : message;
}

async function refreshXToken(account: { provider: string; providerAccountId: string; refresh_token: string }) {
  const clientId = process.env.AUTH_TWITTER_ID;
  const clientSecret = process.env.AUTH_TWITTER_SECRET;
  if (!clientId || !clientSecret) throw new Error("Twitter OAuth not configured");

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: account.refresh_token,
    client_id: clientId,
  });

  const res = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error_description || data?.error || "Token refresh failed");

  await prisma.account.update({
    where: {
      provider_providerAccountId: {
        provider: account.provider,
        providerAccountId: account.providerAccountId,
      },
    },
    data: {
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? account.refresh_token,
      expires_at: data.expires_in ? Math.floor(Date.now() / 1000) + data.expires_in : null,
    },
  });

  return data.access_token as string;
}

async function getXAccessToken(userIds: string[], projectId?: string) {
  const account = await prisma.account.findFirst({
    where: {
      userId: { in: userIds },
      provider: "twitter",
      ...(projectId ? { projectId } : {}),
    },
    orderBy: { expires_at: "desc" },
  });

  if (!account?.access_token) return null;

  const now = Math.floor(Date.now() / 1000);
  const needsRefresh = account.expires_at && account.expires_at < now + 300;

  if (needsRefresh && account.refresh_token) {
    try {
      return await refreshXToken({
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        refresh_token: account.refresh_token,
      });
    } catch {
      return account.access_token;
    }
  }

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

export async function hasXConnection(userId: string, projectId?: string) {
  const memberIds = await getWorkspaceMemberIds(userId);
  const account = await prisma.account.findFirst({
    where: {
      userId: { in: memberIds },
      provider: "twitter",
      access_token: { not: null },
      ...(projectId ? { projectId } : {}),
    },
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

  const accessToken = await getXAccessToken(memberIds, tweet.project.id);
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
    let token = accessToken;
    try {
      const mediaId = tweet.imageUrl ? await uploadXImage(tweet.imageUrl, token) : null;
      const externalPostId = await createXPost(tweet.content, mediaId, token);
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
    } catch (firstErr) {
      const msg = firstErr instanceof Error ? firstErr.message : "";
      const isAuthError = /unauthorized|forbidden|token/i.test(msg);
      if (!isAuthError) throw firstErr;

      const account = await prisma.account.findFirst({
        where: {
          userId: { in: memberIds },
          provider: "twitter",
          ...(tweet.project.id ? { projectId: tweet.project.id } : {}),
        },
        orderBy: { expires_at: "desc" },
      });
      if (!account?.refresh_token) throw firstErr;

      token = await refreshXToken({
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        refresh_token: account.refresh_token,
      });

      const mediaId = tweet.imageUrl ? await uploadXImage(tweet.imageUrl, token) : null;
      const externalPostId = await createXPost(tweet.content, mediaId, token);
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
    }
  } catch (err) {
    const message = await markPublishFailure(tweetId, err instanceof Error ? err.message : "Publish failed");
    return { ok: false, status: 502, error: message };
  }
}
