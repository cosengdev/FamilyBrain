import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const events = await prisma.calendarEvent.findMany({
    where: { householdId: auth.session.householdId },
    orderBy: { startsAt: "asc" },
  });
  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const title = body?.title?.trim();
  const startsAt = body?.startsAt;
  const endsAt = body?.endsAt;

  if (!title || !startsAt || !endsAt) {
    return NextResponse.json({ error: "title, startsAt, and endsAt are required" }, { status: 400 });
  }

  const event = await prisma.calendarEvent.create({
    data: {
      householdId: auth.session.householdId,
      ownerId: auth.session.userId,
      title,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
    },
  });
  return NextResponse.json({ event }, { status: 201 });
}
