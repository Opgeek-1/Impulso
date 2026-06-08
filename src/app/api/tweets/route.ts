import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

  const tweets = await prisma.tweet.findMany({
    where: {
      projectId,
      project: { userId: session.user.id },
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
  const { tweetId, content, status, scheduledAt } = body;

  if (!tweetId) {
    return NextResponse.json({ error: "tweetId is required" }, { status: 400 });
  }

  const tweet = await prisma.tweet.findFirst({
    where: { id: tweetId },
    include: { project: true },
  });

  if (!tweet || tweet.project.userId !== session.user.id) {
    return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
  }

  const updated = await prisma.tweet.update({
    where: { id: tweetId },
    data: {
      ...(content !== undefined && { content }),
      ...(status !== undefined && { status }),
      ...(scheduledAt !== undefined && { scheduledAt: new Date(scheduledAt) }),
    },
  });

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

  const tweet = await prisma.tweet.findFirst({
    where: { id: tweetId },
    include: { project: true },
  });

  if (!tweet || tweet.project.userId !== session.user.id) {
    return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
  }

  await prisma.tweet.delete({ where: { id: tweetId } });

  return NextResponse.json({ success: true });
}
