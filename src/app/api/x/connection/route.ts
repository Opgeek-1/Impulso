import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWorkspaceMemberIds } from "@/lib/workspace";
import { getXConnectionMap, type XConnectionStatus } from "@/lib/x-publish";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const configured = Boolean(process.env.AUTH_TWITTER_ID && process.env.AUTH_TWITTER_SECRET);
  const memberIds = await getWorkspaceMemberIds(session.user.id);
  const connections = await Promise.all(memberIds.map((userId) => getXConnectionMap(userId)));
  const projects: Record<string, XConnectionStatus> = Object.assign({}, ...connections);

  return NextResponse.json({
    configured,
    connected: Object.values(projects).some((project) => project.connected),
    projects,
  });
}
