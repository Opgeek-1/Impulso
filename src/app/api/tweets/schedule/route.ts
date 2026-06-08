import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getWorkspaceMemberIds } from "@/lib/workspace";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const memberIds = await getWorkspaceMemberIds(session.user.id);

  const where: Record<string, unknown> = {
    projectId,
    project: { userId: { in: memberIds } },
    scheduledAt: { not: null },
  };

  if (startDate && endDate) {
    where.scheduledAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  const tweets = await prisma.tweet.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json(tweets);
}
