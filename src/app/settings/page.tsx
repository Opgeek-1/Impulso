import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SettingsPage } from "@/components/settings-page";

export default async function Settings() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { tweets: true, styles: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return <SettingsPage projects={projects} user={session.user} />;
}
