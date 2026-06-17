import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getWorkspaceMemberIds } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const configured = Boolean(process.env.AUTH_TWITTER_ID && process.env.AUTH_TWITTER_SECRET);
  const projectId = req.nextUrl.searchParams.get("projectId");
  const memberIds = await getWorkspaceMemberIds(session.user.id);

  if (projectId) {
    const account = await prisma.account.findFirst({
      where: {
        userId: { in: memberIds },
        provider: "twitter",
        projectId,
        access_token: { not: null },
      },
      select: { providerAccountId: true },
    });
    return NextResponse.json({ configured, connected: Boolean(account) });
  }

  // Global check (any twitter connection)
  const account = await prisma.account.findFirst({
    where: {
      userId: { in: memberIds },
      provider: "twitter",
      access_token: { not: null },
    },
    select: { providerAccountId: true },
  });
  return NextResponse.json({ configured, connected: Boolean(account) });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = req.nextUrl.searchParams.get("projectId");
  const memberIds = await getWorkspaceMemberIds(session.user.id);

  if (projectId) {
    await prisma.account.deleteMany({
      where: { userId: { in: memberIds }, provider: "twitter", projectId },
    });
  } else {
    await prisma.account.deleteMany({
      where: { userId: { in: memberIds }, provider: "twitter" },
    });
  }

  return NextResponse.json({ disconnected: true });
}
