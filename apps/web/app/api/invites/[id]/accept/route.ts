import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const invite = await prisma.invite.findUnique({ where: { id: params.id } });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }
  if (invite.acceptedAt) {
    return NextResponse.json({ error: "This invite has already been used" }, { status: 410 });
  }
  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invite has expired" }, { status: 410 });
  }

  const body = await request.json().catch(() => null);
  const name = body?.name?.trim();
  const password = body?.password;

  if (!name || !password) {
    return NextResponse.json({ error: "name and password are required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email: invite.email } });
  if (existingUser) {
    return NextResponse.json({ error: "That email already has an account" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const [user] = await prisma.$transaction([
    prisma.user.create({
      data: {
        householdId: invite.householdId,
        name,
        email: invite.email,
        passwordHash,
        role: invite.role,
      },
    }),
    prisma.invite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  const token = await createSessionToken({
    userId: user.id,
    householdId: user.householdId,
    role: user.role,
    name: user.name,
  });

  const response = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
