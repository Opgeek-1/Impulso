import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SettingsPage } from "@/components/settings-page";

export const dynamic = "force-dynamic";

export default async function Settings() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: { include: { members: true } } },
  });

  const memberIds = membership
    ? membership.workspace.members.map((m) => m.userId)
    : [session.user.id];

  const projects = await prisma.project.findMany({
    where: { userId: { in: memberIds } },
    include: {
      _count: { select: { tweets: true, styles: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Map brief onto the result for the client
  const projectsWithBrief = projects.map((p) => ({
    ...p,
    brief: p.brief,
  }));

  return (
    <Suspense>
      <SettingsPage projects={projectsWithBrief} user={session.user} />
    </Suspense>
  );
}
