import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find workspace the user belongs to, or create one
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: {
      workspace: {
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true, image: true, avatarSeed: true } } } },
          invites: true,
        },
      },
    },
  });

  if (!membership) {
    const workspace = await prisma.workspace.create({
      data: {
        name: session.user.name || "My Workspace",
        domain: session.user.email?.split("@")[1] || null,
        members: { create: { userId: session.user.id, role: "owner" } },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, image: true, avatarSeed: true } } } },
        invites: true,
      },
    });
    return NextResponse.json(workspace);
  }

  return NextResponse.json(membership.workspace);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { workspaceId, name, domain } = body;

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id, workspaceId, role: "owner" },
  });
  if (!member) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const data: Record<string, string> = {};
  if (name !== undefined) data.name = name;
  if (domain !== undefined) data.domain = domain;

  const updated = await prisma.workspace.update({
    where: { id: workspaceId },
    data,
  });

  return NextResponse.json(updated);
}
