import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const existing = await prisma.renewable.findUnique({ where: { id: params.id } });
  if (!existing || existing.householdId !== auth.session.householdId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const renewable = await prisma.renewable.update({
    where: { id: params.id },
    data: {
      ...(body?.name ? { name: body.name.trim() } : {}),
      ...(body?.dueDate ? { dueDate: new Date(body.dueDate) } : {}),
      ...(typeof body?.amount === "number" ? { amount: body.amount } : {}),
    },
  });
  return NextResponse.json({ renewable });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const existing = await prisma.renewable.findUnique({ where: { id: params.id } });
  if (!existing || existing.householdId !== auth.session.householdId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.renewable.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
