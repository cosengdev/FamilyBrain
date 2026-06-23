import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { generateAndSaveMealPlan } from "@/lib/meal-plan";
import { serializeMealPlan } from "@/lib/serialize";

export async function GET() {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const mealPlan = await prisma.mealPlan.findFirst({
    where: { householdId: auth.session.householdId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ mealPlan: mealPlan ? serializeMealPlan(mealPlan) : null });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const notes = typeof body?.notes === "string" && body.notes.trim() ? body.notes.trim() : undefined;

  const mealPlan = await generateAndSaveMealPlan(auth.session.householdId, notes);
  return NextResponse.json({ mealPlan: serializeMealPlan(mealPlan) }, { status: 201 });
}
