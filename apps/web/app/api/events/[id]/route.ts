import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const existing = await prisma.calendarEvent.findUnique({ where: { id: params.id } });
  if (!existing || existing.householdId !== auth.session.householdId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const event = await prisma.calendarEvent.update({
    where: { id: params.id },
    data: {
      ...(body?.title ? { title: body.title.trim() } : {}),
      ...(body?.startsAt ? { startsAt: new Date(body.startsAt) } : {}),
      ...(body?.endsAt ? { endsAt: new Date(body.endsAt) } : {}),
    },
  });
  return NextResponse.json({ event });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const existing = await prisma.calendarEvent.findUnique({ where: { id: params.id } });
  if (!existing || existing.householdId !== auth.session.householdId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.calendarEvent.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
