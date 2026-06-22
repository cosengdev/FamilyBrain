import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const items = await prisma.shoppingItem.findMany({
    where: { householdId: auth.session.householdId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const name = body?.name?.trim();
  const quantity = Number.isFinite(body?.quantity) ? body.quantity : 1;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const item = await prisma.shoppingItem.create({
    data: { householdId: auth.session.householdId, name, quantity },
  });
  return NextResponse.json({ item }, { status: 201 });
}
