import { prisma } from "@/lib/db";

/**
 * Get all user IDs that belong to the same workspace as the given user.
 * Used for workspace-scoped access control on projects/tweets/styles.
 */
export async function getWorkspaceMemberIds(userId: string): Promise<string[]> {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: { workspace: { include: { members: true } } },
  });

  if (!membership) return [userId];
  return membership.workspace.members.map((m) => m.userId);
}
