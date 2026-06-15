import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth, signIn } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getWorkspaceMemberIds } from "@/lib/workspace";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const memberIds = await getWorkspaceMemberIds(session.user.id);
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: { in: memberIds } },
    select: { id: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  (await cookies()).set("impulso_x_project_id", project.id, {
    httpOnly: true,
    maxAge: 15 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  (await cookies()).set("impulso_x_user_id", session.user.id, {
    httpOnly: true,
    maxAge: 15 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  await signIn("twitter", { redirectTo: "/settings?tab=accounts" });
}
