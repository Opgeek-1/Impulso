import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { token, name, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
  }

  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: { workspace: true },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
  }

  const hashed = await bcrypt.hash(password, 12);

  // Find or create user
  let user = await prisma.user.findUnique({ where: { email: invite.email } });

  if (user) {
    // Update existing user's password
    user = await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, name: name || user.name },
    });
  } else {
    // Create new user
    user = await prisma.user.create({
      data: {
        email: invite.email,
        name: name || invite.email.split("@")[0],
        password: hashed,
        emailVerified: new Date(),
      },
    });
  }

  // Check if already a member
  const existingMembership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id, workspaceId: invite.workspaceId },
  });

  if (!existingMembership) {
    await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: invite.workspaceId,
        role: invite.role,
      },
    });
  }

  // Delete the invite
  await prisma.workspaceInvite.delete({ where: { id: invite.id } });

  return NextResponse.json({ success: true, email: invite.email });
}
