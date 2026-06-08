import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name: name || email.split("@")[0], email, password: hashed, emailVerified: new Date() },
  });

  // Check for pending invites and auto-join workspaces
  const pendingInvites = await prisma.workspaceInvite.findMany({
    where: { email },
  });

  for (const invite of pendingInvites) {
    const existingMembership = await prisma.workspaceMember.findFirst({
      where: { userId: user.id, workspaceId: invite.workspaceId },
    });
    if (!existingMembership) {
      await prisma.workspaceMember.create({
        data: { userId: user.id, workspaceId: invite.workspaceId, role: invite.role },
      });
    }
    await prisma.workspaceInvite.delete({ where: { id: invite.id } });
  }

  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}
