import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.redirect(new URL("/settings?tab=accounts", req.url));
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId },
  });

  if (!project) {
    return NextResponse.redirect(new URL("/settings?tab=accounts", req.url));
  }

  // Find the most recently issued Twitter account for this user that isn't
  // already linked to a different project.
  const account = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      provider: "twitter",
      OR: [{ projectId: null }, { projectId }],
    },
    orderBy: { expires_at: "desc" },
  });

  if (account) {
    await prisma.account.update({
      where: {
        provider_providerAccountId: {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        },
      },
      data: { projectId },
    });
  }

  return NextResponse.redirect(new URL("/settings?tab=accounts", req.url));
}
