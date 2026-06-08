import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Dashboard } from "@/components/dashboard";

export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Get workspace member IDs to show shared projects
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

  return <Dashboard projects={projects} user={session.user} />;
}
