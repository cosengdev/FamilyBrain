import { prisma } from "@/lib/prisma";
import AcceptInviteForm from "./AcceptInviteForm";

export default async function InvitePage({ params }: { params: { id: string } }) {
  const invite = await prisma.invite.findUnique({
    where: { id: params.id },
    include: { household: { select: { name: true } } },
  });

  if (!invite) {
    return (
      <main>
        <h1>Invite not found</h1>
        <p>This invite link doesn&apos;t exist. Ask whoever sent it to check the link.</p>
      </main>
    );
  }
  if (invite.acceptedAt) {
    return (
      <main>
        <h1>Already used</h1>
        <p>This invite has already been accepted. Try logging in instead.</p>
      </main>
    );
  }
  if (invite.expiresAt < new Date()) {
    return (
      <main>
        <h1>Invite expired</h1>
        <p>This invite link has expired. Ask for a new one.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Join {invite.household.name}</h1>
      <p>
        You&apos;ve been invited to join as <strong>{invite.role.replace(/_/g, " ").toLowerCase()}</strong>.
      </p>
      <AcceptInviteForm inviteId={invite.id} email={invite.email} />
    </main>
  );
}
