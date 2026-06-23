import { prisma } from "./prisma";

export interface BudgetSummary {
  month: string;
  totalThisMonth: number;
  byCategory: { category: string; total: number }[];
  anomalies: { category: string; currentTotal: number; previousAverage: number; difference: number }[];
}

export async function buildBudgetSummary(householdId: string): Promise<BudgetSummary> {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const startOfHistory = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  const [thisMonth, priorMonths] = await Promise.all([
    prisma.transaction.findMany({
      where: { householdId, occurredAt: { gte: startOfThisMonth, lt: startOfNextMonth } },
    }),
    prisma.transaction.findMany({
      where: { householdId, occurredAt: { gte: startOfHistory, lt: startOfThisMonth } },
    }),
  ]);

  const byCategoryMap = new Map<string, number>();
  for (const t of thisMonth) {
    byCategoryMap.set(t.category, (byCategoryMap.get(t.category) ?? 0) + Number(t.amount));
  }

  const priorByCategoryMap = new Map<string, number>();
  for (const t of priorMonths) {
    priorByCategoryMap.set(t.category, (priorByCategoryMap.get(t.category) ?? 0) + Number(t.amount));
  }

  const byCategory = Array.from(byCategoryMap.entries()).map(([category, total]) => ({ category, total }));
  const totalThisMonth = byCategory.reduce((sum, c) => sum + c.total, 0);

  const anomalies: BudgetSummary["anomalies"] = [];
  for (const { category, total } of byCategory) {
    const previousAverage = (priorByCategoryMap.get(category) ?? 0) / 3;
    const difference = total - previousAverage;
    if (previousAverage > 0 && difference > 20 && difference > previousAverage * 0.25) {
      anomalies.push({ category, currentTotal: total, previousAverage, difference });
    }
  }

  const month = `${startOfThisMonth.getFullYear()}-${String(startOfThisMonth.getMonth() + 1).padStart(2, "0")}`;

  return {
    month,
    totalThisMonth,
    byCategory,
    anomalies,
  };
}
