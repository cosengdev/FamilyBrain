import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { serializeShoppingItem } from "@/lib/serialize";
import type { MealPlanDay } from "@/lib/meal-plan";

export async function POST() {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const mealPlan = await prisma.mealPlan.findFirst({
    where: { householdId: auth.session.householdId },
    orderBy: { createdAt: "desc" },
  });
  if (!mealPlan) {
    return NextResponse.json({ error: "No meal plan to add ingredients from" }, { status: 404 });
  }

  const days = mealPlan.days as unknown as MealPlanDay[];
  const ingredientNames = Array.from(new Set(days.flatMap((d) => d.ingredients)));

  const existing = await prisma.shoppingItem.findMany({
    where: { householdId: auth.session.householdId, checkedAt: null },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((i) => i.name.toLowerCase()));
  const toAdd = ingredientNames.filter((name) => !existingNames.has(name.toLowerCase()));

  const items = await prisma.$transaction(
    toAdd.map((name) => prisma.shoppingItem.create({ data: { householdId: auth.session.householdId, name } }))
  );

  return NextResponse.json({ items: items.map(serializeShoppingItem) });
}
