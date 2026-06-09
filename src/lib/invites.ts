import { prisma } from "@/lib/db";

export async function acceptWorkspaceInvite(token: string, userId: string) {
  const invite = await prisma.workspaceInvite.findUnique({ where: { token } });

  if (!invite) {
    return { ok: false as const, error: "Invalid or expired invite" };
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    await prisma.workspaceInvite.delete({ where: { id: invite.id } });
    return { ok: false as const, error: "Invalid or expired invite" };
  }

  const existingMembership = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId: invite.workspaceId },
  });

  if (!existingMembership) {
    await prisma.workspaceMember.create({
      data: {
        userId,
        workspaceId: invite.workspaceId,
        role: invite.role,
      },
    });
  }

  await prisma.workspaceInvite.delete({ where: { id: invite.id } });

  return { ok: true as const };
}
