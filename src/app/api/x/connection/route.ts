import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasXConnection } from "@/lib/x-publish";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const configured = Boolean(process.env.AUTH_TWITTER_ID && process.env.AUTH_TWITTER_SECRET);
  const connected = await hasXConnection(session.user.id);
  return NextResponse.json({ configured, connected });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.account.deleteMany({
    where: { userId: session.user.id, provider: "twitter" },
  });

  return NextResponse.json({ disconnected: true });
}
