import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Dashboard } from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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
    include: { _count: { select: { tweets: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Suspense>
      <Dashboard projects={projects} user={session.user} />
    </Suspense>
  );
}
