import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { acceptWorkspaceInvite } from "@/lib/invites";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  const { token, name, email, password } = await req.json();

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
  });

  if (!invite || (invite.expiresAt && invite.expiresAt < new Date())) {
    if (invite) {
      await prisma.workspaceInvite.delete({ where: { id: invite.id } });
    }
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
  }

  if (session?.user?.id) {
    const result = await acceptWorkspaceInvite(token, session.user.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  }

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return NextResponse.json(
      { error: "Password must include uppercase, lowercase, and a number" },
      { status: 400 }
    );
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    return NextResponse.json(
      { error: "An account with this email already exists. Sign in first, then open the invite link again." },
      { status: 409 }
    );
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: name || normalizedEmail.split("@")[0],
      password: hashed,
    },
  });

  const result = await acceptWorkspaceInvite(token, user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ success: true, email: user.email });
}
