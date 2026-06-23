import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { serializeBudgetGoal } from "@/lib/serialize";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const existing = await prisma.budgetGoal.findUnique({ where: { id: params.id } });
  if (!existing || existing.householdId !== auth.session.householdId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const addAmount = Number(body?.addAmount);
  if (!Number.isFinite(addAmount)) {
    return NextResponse.json({ error: "addAmount must be a number" }, { status: 400 });
  }

  const goal = await prisma.budgetGoal.update({
    where: { id: params.id },
    data: { savedAmount: { increment: addAmount } },
  });
  return NextResponse.json({ goal: serializeBudgetGoal(goal) });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const existing = await prisma.budgetGoal.findUnique({ where: { id: params.id } });
  if (!existing || existing.householdId !== auth.session.householdId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.budgetGoal.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
