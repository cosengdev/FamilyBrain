import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const contacts = await prisma.emergencyContact.findMany({
    where: { householdId: auth.session.householdId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ contacts });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const name = body?.name?.trim();
  const relationship = body?.relationship?.trim();
  const phone = body?.phone?.trim();

  if (!name || !relationship || !phone) {
    return NextResponse.json({ error: "name, relationship, and phone are required" }, { status: 400 });
  }

  const contact = await prisma.emergencyContact.create({
    data: { householdId: auth.session.householdId, name, relationship, phone },
  });
  return NextResponse.json({ contact }, { status: 201 });
}
