import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { HelpPage } from "@/components/help-page";

export const dynamic = "force-dynamic";

export default async function Help() {
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

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatarSeed: true },
  }).catch(() => null);

  return <HelpPage projects={projects} user={{ ...session.user, avatarSeed: dbUser?.avatarSeed }} />;
}
