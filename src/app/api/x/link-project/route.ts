import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchXProfile } from "@/lib/x-api";

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

    // Sync X profile info (name, handle, avatar) to the project
    if (account.access_token) {
      try {
        const profile = await fetchXProfile(account.access_token);
        const profileImageUrl = profile.profile_image_url?.replace("_normal", "_400x400");
        await prisma.project.update({
          where: { id: projectId },
          data: {
            name: profile.name,
            handle: profile.username,
            ...(profileImageUrl ? { avatarUrl: profileImageUrl } : {}),
          },
        });
      } catch {
        // Non-critical — project keeps its manually-entered name/handle
      }
    }
  }

  return NextResponse.redirect(new URL("/settings?tab=accounts", req.url));
}
