import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { avatarSeed } = await req.json();
  if (typeof avatarSeed !== "string" || avatarSeed.length > 100) {
    return NextResponse.json({ error: "Invalid seed" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarSeed },
    select: { avatarSeed: true },
  });

  return NextResponse.json(updated);
}
