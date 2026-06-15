import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ManualPage } from "@/components/manual-page";
import { redirect } from "next/navigation";

export default async function Manual() {
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

  return <ManualPage projects={projects} user={session.user} />;
}
