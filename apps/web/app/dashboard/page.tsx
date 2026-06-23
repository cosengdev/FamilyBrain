import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { buildDigest } from "@/lib/digest";
import {
  serializeEvent,
  serializeShoppingItem,
  serializeRenewable,
  serializeEmergencyContact,
  serializeMedicalProfile,
  serializeInvite,
} from "@/lib/serialize";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const [household, events, shoppingItems, renewables, emergencyContacts, medicalProfile, invites, digest] =
    await Promise.all([
      prisma.household.findUnique({ where: { id: session.householdId } }),
      prisma.calendarEvent.findMany({
        where: { householdId: session.householdId },
        orderBy: { startsAt: "asc" },
      }),
      prisma.shoppingItem.findMany({
        where: { householdId: session.householdId },
        orderBy: { createdAt: "asc" },
      }),
      prisma.renewable.findMany({
        where: { householdId: session.householdId },
        orderBy: { dueDate: "asc" },
      }),
      prisma.emergencyContact.findMany({
        where: { householdId: session.householdId },
        orderBy: { createdAt: "asc" },
      }),
      prisma.medicalProfile.findUnique({ where: { userId: session.userId } }),
      session.role === "ADMIN"
        ? prisma.invite.findMany({ where: { householdId: session.householdId }, orderBy: { createdAt: "desc" } })
        : Promise.resolve([]),
      buildDigest(session.householdId),
    ]);

  return (
    <DashboardClient
      userName={session.name}
      role={session.role}
      householdName={household?.name ?? "Your household"}
      initialEvents={events.map(serializeEvent)}
      initialShoppingItems={shoppingItems.map(serializeShoppingItem)}
      initialRenewables={renewables.map(serializeRenewable)}
      initialEmergencyContacts={emergencyContacts.map(serializeEmergencyContact)}
      initialMedicalProfile={serializeMedicalProfile(medicalProfile)}
      initialInvites={invites.map(serializeInvite)}
      digest={digest}
    />
  );
}
