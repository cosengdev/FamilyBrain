import { prisma } from "./prisma";

export interface DigestEvent {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
}

export interface DigestRenewable {
  id: string;
  name: string;
  type: string;
  dueDate: string;
  daysUntil: number;
}

export interface Digest {
  todayEvents: DigestEvent[];
  upcomingRenewables: DigestRenewable[];
  shoppingItemCount: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export async function buildDigest(householdId: string): Promise<Digest> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday.getTime() + DAY_MS);
  const horizon = new Date(startOfToday.getTime() + 30 * DAY_MS);

  const [todayEvents, renewables, shoppingItemCount] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: { householdId, startsAt: { gte: startOfToday, lt: startOfTomorrow } },
      orderBy: { startsAt: "asc" },
    }),
    prisma.renewable.findMany({
      where: { householdId, dueDate: { gte: startOfToday, lte: horizon } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.shoppingItem.count({ where: { householdId, checkedAt: null } }),
  ]);

  return {
    todayEvents: todayEvents.map((e) => ({
      id: e.id,
      title: e.title,
      startsAt: e.startsAt.toISOString(),
      endsAt: e.endsAt.toISOString(),
    })),
    upcomingRenewables: renewables.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      dueDate: r.dueDate.toISOString(),
      daysUntil: Math.ceil((r.dueDate.getTime() - startOfToday.getTime()) / DAY_MS),
    })),
    shoppingItemCount,
  };
}
