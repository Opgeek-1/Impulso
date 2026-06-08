import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { email, code } = await req.json();
  if (!email || !code) {
    return NextResponse.json({ error: "Email and code required" }, { status: 400 });
  }

  const token = await prisma.verificationToken.findFirst({
    where: { identifier: email, token: code },
  });

  if (!token) {
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }

  if (token.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: email, token: code } },
    });
    return NextResponse.json({ error: "Code expired" }, { status: 401 });
  }

  // Code is valid — clean up
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: email, token: code } },
  });

  // Mark email as verified
  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

  return NextResponse.json({ success: true });
}
