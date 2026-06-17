import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, password } = body;

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

  const hashed = await bcrypt.hash(password, 12);

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  let user;
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  } else {
    user = await prisma.user.create({
      data: { name: name || normalizedEmail.split("@")[0], email: normalizedEmail, password: hashed, emailVerified: new Date() },
    });
  }

  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}
