import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getWorkspaceMemberIds } from "@/lib/workspace";
import { removeGeneratedImage } from "@/lib/image-files";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const memberIds = await getWorkspaceMemberIds(session.user.id);

  const tweets = await prisma.tweet.findMany({
    where: {
      projectId,
      project: { userId: { in: memberIds } },
    },
    orderBy: { createdAt: "desc" },
    include: { batch: true },
  });

  return NextResponse.json(tweets);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { tweetId, content, status, scheduledAt, imageUrl, imagePrompt } = body;

  if (!tweetId) {
    return NextResponse.json({ error: "tweetId is required" }, { status: 400 });
  }

  const memberIds = await getWorkspaceMemberIds(session.user.id);

  const tweet = await prisma.tweet.findFirst({
    where: { id: tweetId },
    include: { project: true },
  });

  if (!tweet || !memberIds.includes(tweet.project.userId)) {
    return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
  }

  if (tweet.externalPostId && (status !== undefined || scheduledAt !== undefined)) {
    return NextResponse.json({ error: "Posted tweets cannot be rescheduled" }, { status: 409 });
  }

  const validStatuses = [
    "DRAFT", "CURATED", "DESIGNED", "IMAGE_GENERATED", "SCHEDULED",
    "PUBLISHING", "PUBLISH_FAILED", "POSTED",
  ];
  if (status !== undefined && !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const statusRank = (s: string) => validStatuses.indexOf(s);
  if (status !== undefined && status !== "DRAFT" && status !== "CURATED" && status !== "DESIGNED"
    && statusRank(status) < statusRank(tweet.status)
    && !["PUBLISH_FAILED"].includes(tweet.status)) {
    return NextResponse.json(
      { error: `Cannot change status from ${tweet.status} to ${status}` },
      { status: 400 }
    );
  }

  const updated = await prisma.tweet.update({
    where: { id: tweetId },
    data: {
      ...(content !== undefined && { content }),
      ...(status !== undefined && { status }),
      ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(imagePrompt !== undefined && { imagePrompt }),
    },
  });

  if (imageUrl === null) {
    await removeGeneratedImage(tweet.imageUrl).catch((error) => {
      console.error("Failed to remove deleted tweet image", error);
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tweetId = searchParams.get("tweetId");

  if (!tweetId) {
    return NextResponse.json({ error: "tweetId is required" }, { status: 400 });
  }

  const memberIds = await getWorkspaceMemberIds(session.user.id);

  const tweet = await prisma.tweet.findFirst({
    where: { id: tweetId },
    include: { project: true },
  });

  if (!tweet || !memberIds.includes(tweet.project.userId)) {
    return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
  }

  await prisma.tweet.delete({ where: { id: tweetId } });

  return NextResponse.json({ success: true });
}
