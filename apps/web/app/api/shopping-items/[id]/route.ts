import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const existing = await prisma.shoppingItem.findUnique({ where: { id: params.id } });
  if (!existing || existing.householdId !== auth.session.householdId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const item = await prisma.shoppingItem.update({
    where: { id: params.id },
    data: {
      ...(body?.name ? { name: body.name.trim() } : {}),
      ...(typeof body?.quantity === "number" ? { quantity: body.quantity } : {}),
      ...(body?.checked === true ? { checkedAt: new Date() } : {}),
      ...(body?.checked === false ? { checkedAt: null } : {}),
    },
  });
  return NextResponse.json({ item });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const existing = await prisma.shoppingItem.findUnique({ where: { id: params.id } });
  if (!existing || existing.householdId !== auth.session.householdId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.shoppingItem.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
