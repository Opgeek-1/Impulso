import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getWorkspaceMemberIds } from "@/lib/workspace";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberIds = await getWorkspaceMemberIds(session.user.id);

  const projects = await prisma.project.findMany({
    where: { userId: { in: memberIds } },
    include: { _count: { select: { tweets: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, handle, description } = body;

  if (!name || !handle) {
    return NextResponse.json({ error: "Name and handle are required" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      name,
      handle,
      description,
      userId: session.user.id,
    },
  });

  return NextResponse.json(project);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberIds = await getWorkspaceMemberIds(session.user.id);

  const body = await req.json();
  const { projectId, name, handle, avatarUrl } = body;

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: { in: memberIds } },
  });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: Record<string, string> = {};
  if (name !== undefined) data.name = name;
  if (handle !== undefined) data.handle = handle;
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;

  const updated = await prisma.project.update({
    where: { id: projectId },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberIds = await getWorkspaceMemberIds(session.user.id);

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: { in: memberIds } },
  });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.project.delete({ where: { id: projectId } });
  return NextResponse.json({ success: true });
}
