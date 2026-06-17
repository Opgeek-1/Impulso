import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");
  if (!memberId) {
    return NextResponse.json({ error: "memberId required" }, { status: 400 });
  }

  const target = await prisma.workspaceMember.findUnique({ where: { id: memberId } });
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const requester = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id, workspaceId: target.workspaceId, role: "owner" },
  });
  if (!requester) {
    return NextResponse.json({ error: "Only owners can remove members" }, { status: 403 });
  }

  if (target.role === "owner") {
    return NextResponse.json({ error: "Cannot remove owner" }, { status: 400 });
  }

  await prisma.workspaceMember.delete({ where: { id: memberId } });
  return NextResponse.json({ success: true });
}
