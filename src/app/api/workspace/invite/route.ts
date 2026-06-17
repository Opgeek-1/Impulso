import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await req.json();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id, workspaceId, role: "owner" },
  });
  if (!member) {
    return NextResponse.json({ error: "Only owners can invite" }, { status: 403 });
  }

  const invite = await prisma.workspaceInvite.create({
    data: {
      workspaceId,
      token: crypto.randomBytes(32).toString("base64url"),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json(invite);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const inviteId = searchParams.get("inviteId");
  if (!inviteId) {
    return NextResponse.json({ error: "inviteId required" }, { status: 400 });
  }

  const invite = await prisma.workspaceInvite.findUnique({ where: { id: inviteId }, include: { workspace: true } });
  if (!invite) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id, workspaceId: invite.workspaceId, role: "owner" },
  });
  if (!member) {
    return NextResponse.json({ error: "Only owners can remove invites" }, { status: 403 });
  }

  await prisma.workspaceInvite.delete({ where: { id: inviteId } });
  return NextResponse.json({ success: true });
}
