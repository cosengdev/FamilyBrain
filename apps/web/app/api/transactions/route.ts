import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { serializeTransaction } from "@/lib/serialize";

const CATEGORIES = ["GROCERIES", "BILLS", "TRANSPORT", "ENTERTAINMENT", "HEALTH", "EDUCATION", "SAVINGS", "OTHER"];

export async function GET() {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const transactions = await prisma.transaction.findMany({
    where: { householdId: auth.session.householdId },
    orderBy: { occurredAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ transactions: transactions.map(serializeTransaction) });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const description = body?.description?.trim();
  const amount = Number(body?.amount);
  const category = CATEGORIES.includes(body?.category) ? body.category : "OTHER";
  const occurredAt = body?.occurredAt ? new Date(body.occurredAt) : new Date();

  if (!description || !Number.isFinite(amount)) {
    return NextResponse.json({ error: "description and a numeric amount are required" }, { status: 400 });
  }

  const transaction = await prisma.transaction.create({
    data: { householdId: auth.session.householdId, description, amount, category, occurredAt },
  });
  return NextResponse.json({ transaction: serializeTransaction(transaction) }, { status: 201 });
}
