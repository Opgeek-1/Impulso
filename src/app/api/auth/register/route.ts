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

  const hashed = await bcrypt.hash(password, 12);

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  let user;
  if (existing) {
    // If user exists and already has a password, reject
    if (existing.password) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }
    // User was auto-created (e.g. by old code flow) without a password — let them claim it
    user = await prisma.user.update({
      where: { id: existing.id },
      data: { name: name || existing.name, password: hashed, emailVerified: new Date() },
    });
  } else {
    user = await prisma.user.create({
      data: { name: name || normalizedEmail.split("@")[0], email: normalizedEmail, password: hashed, emailVerified: new Date() },
    });
  }

  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}
