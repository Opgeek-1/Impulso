import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasXConnection } from "@/lib/x-publish";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const configured = Boolean(process.env.AUTH_TWITTER_ID && process.env.AUTH_TWITTER_SECRET);
  const connected = await hasXConnection(session.user.id);
  return NextResponse.json({ configured, connected });
}
