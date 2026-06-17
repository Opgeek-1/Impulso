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

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const memberIds = await getWorkspaceMemberIds(session.user.id);

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: { in: memberIds } },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const styles = await prisma.style.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(styles);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { projectId, name, content, isDefault } = body;

  if (!projectId || !name || !content) {
    return NextResponse.json({ error: "projectId, name, and content are required" }, { status: 400 });
  }

  const memberIds = await getWorkspaceMemberIds(session.user.id);

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: { in: memberIds } },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (isDefault) {
    await prisma.style.updateMany({
      where: { projectId },
      data: { isDefault: false },
    });
  }

  const style = await prisma.style.create({
    data: { name, content, isDefault: isDefault ?? false, projectId },
  });

  return NextResponse.json(style);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { styleId, name, content, isDefault } = body;

  if (!styleId) {
    return NextResponse.json({ error: "styleId is required" }, { status: 400 });
  }

  const memberIds = await getWorkspaceMemberIds(session.user.id);

  const style = await prisma.style.findFirst({
    where: { id: styleId },
    include: { project: true },
  });
  if (!style || !memberIds.includes(style.project.userId)) {
    return NextResponse.json({ error: "Style not found" }, { status: 404 });
  }

  if (isDefault) {
    await prisma.style.updateMany({
      where: { projectId: style.projectId },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.style.update({
    where: { id: styleId },
    data: {
      ...(name !== undefined && { name }),
      ...(content !== undefined && { content }),
      ...(isDefault !== undefined && { isDefault }),
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
  const styleId = searchParams.get("styleId");

  if (!styleId) {
    return NextResponse.json({ error: "styleId is required" }, { status: 400 });
  }

  const memberIds = await getWorkspaceMemberIds(session.user.id);

  const style = await prisma.style.findFirst({
    where: { id: styleId },
    include: { project: true },
  });
  if (!style || !memberIds.includes(style.project.userId)) {
    return NextResponse.json({ error: "Style not found" }, { status: 404 });
  }

  await prisma.style.delete({ where: { id: styleId } });

  return NextResponse.json({ success: true });
}
