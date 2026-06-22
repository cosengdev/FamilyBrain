import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

const RENEWABLE_TYPES = [
  "BILL",
  "INSURANCE",
  "MOT",
  "PASSPORT",
  "VISA",
  "DRIVING_LICENCE",
  "TV_LICENCE",
  "SUBSCRIPTION",
  "WARRANTY",
  "OTHER",
];

export async function GET() {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const renewables = await prisma.renewable.findMany({
    where: { householdId: auth.session.householdId },
    orderBy: { dueDate: "asc" },
  });
  return NextResponse.json({ renewables });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const name = body?.name?.trim();
  const dueDate = body?.dueDate;
  const type = RENEWABLE_TYPES.includes(body?.type) ? body.type : "OTHER";
  const amount = Number.isFinite(body?.amount) ? body.amount : undefined;

  if (!name || !dueDate) {
    return NextResponse.json({ error: "name and dueDate are required" }, { status: 400 });
  }

  const renewable = await prisma.renewable.create({
    data: {
      householdId: auth.session.householdId,
      name,
      type,
      dueDate: new Date(dueDate),
      amount,
    },
  });
  return NextResponse.json({ renewable }, { status: 201 });
}
