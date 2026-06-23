import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { serializeBudgetGoal } from "@/lib/serialize";

export async function GET() {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const goals = await prisma.budgetGoal.findMany({
    where: { householdId: auth.session.householdId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ goals: goals.map(serializeBudgetGoal) });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const name = body?.name?.trim();
  const targetAmount = Number(body?.targetAmount);
  const targetDate = body?.targetDate ? new Date(body.targetDate) : undefined;

  if (!name || !Number.isFinite(targetAmount)) {
    return NextResponse.json({ error: "name and a numeric targetAmount are required" }, { status: 400 });
  }

  const goal = await prisma.budgetGoal.create({
    data: { householdId: auth.session.householdId, name, targetAmount, targetDate },
  });
  return NextResponse.json({ goal: serializeBudgetGoal(goal) }, { status: 201 });
}
