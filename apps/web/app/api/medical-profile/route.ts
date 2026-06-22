import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const profile = await prisma.medicalProfile.findUnique({
    where: { userId: auth.session.userId },
  });
  return NextResponse.json({ profile });
}

export async function PUT(request: NextRequest) {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const { allergies, conditions, medications, gpName, gpPhone } = body ?? {};

  const profile = await prisma.medicalProfile.upsert({
    where: { userId: auth.session.userId },
    create: { userId: auth.session.userId, allergies, conditions, medications, gpName, gpPhone },
    update: { allergies, conditions, medications, gpName, gpPhone },
  });
  return NextResponse.json({ profile });
}
