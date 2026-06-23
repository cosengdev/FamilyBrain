import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

const ROLES = ["ADMIN", "ADULT", "TEEN", "CHILD", "CARER"];
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET() {
  const auth = await requireSession();
  if (auth.response) return auth.response;
  if (auth.session.role !== "ADMIN") {
    return NextResponse.json({ error: "Only an admin can view invites" }, { status: 403 });
  }

  const invites = await prisma.invite.findMany({
    where: { householdId: auth.session.householdId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ invites });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (auth.response) return auth.response;
  if (auth.session.role !== "ADMIN") {
    return NextResponse.json({ error: "Only an admin can send invites" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const email = body?.email?.trim().toLowerCase();
  const role = ROLES.includes(body?.role) ? body.role : "ADULT";

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "That email already has an account" }, { status: 409 });
  }

  const invite = await prisma.invite.create({
    data: {
      householdId: auth.session.householdId,
      email,
      role,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });
  return NextResponse.json({ invite }, { status: 201 });
}
