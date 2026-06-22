import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const existing = await prisma.emergencyContact.findUnique({ where: { id: params.id } });
  if (!existing || existing.householdId !== auth.session.householdId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.emergencyContact.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
