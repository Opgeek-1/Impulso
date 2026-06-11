import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { acceptWorkspaceInvite } from "@/lib/invites";
import { AcceptInviteForm } from "@/components/accept-invite-form";

export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: {
      workspace: {
        include: {
          members: {
            where: { role: "owner" },
            include: { user: { select: { name: true, email: true } } },
          },
        },
      },
    },
  });

  if (!invite || (invite.expiresAt && invite.expiresAt < new Date())) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--imp-bg)" }}>
        <div
          className="w-full max-w-sm rounded-2xl p-8 text-center"
          style={{
            background: "var(--imp-surface)",
            border: "1px solid var(--imp-border-2)",
            boxShadow: "var(--imp-shadow)",
          }}
        >
          <h1 className="text-xl font-bold mb-2" style={{ color: "var(--imp-text)" }}>Invalid invite</h1>
          <p className="text-[13px]" style={{ color: "var(--imp-muted)" }}>
            This invite link is invalid or has already been used.
          </p>
          <a
            href="/login"
            className="inline-block mt-4 text-[13px] font-medium"
            style={{ color: "var(--imp-accent)" }}
          >
            Go to login
          </a>
        </div>
      </div>
    );
  }

  const session = await auth();
  if (session?.user?.id) {
    await acceptWorkspaceInvite(token, session.user.id);
    redirect("/");
  }

  const owner = invite.workspace.members[0]?.user;

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--imp-bg)" }}>
      <AcceptInviteForm
        token={token}
        workspaceName={invite.workspace.name}
        inviterName={owner?.name || owner?.email || "Someone"}
      />
    </div>
  );
}
