import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { buildDigest } from "@/lib/digest";
import { buildBudgetSummary } from "@/lib/budget";
import {
  serializeEvent,
  serializeShoppingItem,
  serializeRenewable,
  serializeEmergencyContact,
  serializeMedicalProfile,
  serializeInvite,
  serializeMealPlan,
  serializeTransaction,
  serializeBudgetGoal,
  serializeBankConnection,
} from "@/lib/serialize";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { bank?: string };
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const [
    household,
    events,
    shoppingItems,
    renewables,
    emergencyContacts,
    medicalProfile,
    invites,
    mealPlan,
    transactions,
    budgetGoals,
    bankConnection,
    budgetSummary,
    digest,
  ] = await Promise.all([
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
    prisma.mealPlan.findFirst({ where: { householdId: session.householdId }, orderBy: { createdAt: "desc" } }),
    prisma.transaction.findMany({
      where: { householdId: session.householdId },
      orderBy: { occurredAt: "desc" },
      take: 100,
    }),
    prisma.budgetGoal.findMany({ where: { householdId: session.householdId }, orderBy: { createdAt: "asc" } }),
    prisma.bankConnection.findFirst({ where: { householdId: session.householdId }, orderBy: { createdAt: "desc" } }),
    buildBudgetSummary(session.householdId),
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
      initialMealPlan={mealPlan ? serializeMealPlan(mealPlan) : null}
      initialTransactions={transactions.map(serializeTransaction)}
      initialBudgetGoals={budgetGoals.map(serializeBudgetGoal)}
      initialBankConnection={serializeBankConnection(bankConnection)}
      bankStatus={searchParams.bank}
      budgetSummary={budgetSummary}
      digest={digest}
    />
  );
}
