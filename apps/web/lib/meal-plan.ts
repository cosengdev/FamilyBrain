import type Anthropic from "@anthropic-ai/sdk";
import type { Prisma } from "@prisma/client";
import { anthropic, ASSISTANT_MODEL } from "./anthropic";
import { prisma } from "./prisma";

export interface MealPlanDay {
  date: string;
  title: string;
  ingredients: string[];
}

const PROPOSE_MEAL_PLAN_TOOL: Anthropic.Tool = {
  name: "propose_meal_plan",
  description: "Propose a 7-day dinner meal plan",
  input_schema: {
    type: "object",
    properties: {
      days: {
        type: "array",
        items: {
          type: "object",
          properties: {
            date: { type: "string", description: "ISO 8601 date" },
            title: { type: "string" },
            ingredients: { type: "array", items: { type: "string" } },
          },
          required: ["date", "title", "ingredients"],
        },
      },
    },
    required: ["days"],
  },
};

function startOfWeek(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function generateAndSaveMealPlan(householdId: string, notes?: string) {
  const household = await prisma.household.findUnique({ where: { id: householdId } });
  const dietaryNotes = notes ?? household?.dietaryNotes ?? "";

  if (notes && notes !== household?.dietaryNotes) {
    await prisma.household.update({ where: { id: householdId }, data: { dietaryNotes: notes } });
  }

  const weekStartDate = startOfWeek(new Date());
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStartDate.getTime() + i * 86400000);
    return toDateString(d);
  });

  const response = await anthropic.messages.create({
    model: ASSISTANT_MODEL,
    max_tokens: 1500,
    system:
      "You plan varied, family-friendly dinners for a week, respecting any allergies or dietary notes given. Keep ingredient lists short and practical for a UK weekly shop.",
    tools: [PROPOSE_MEAL_PLAN_TOOL],
    tool_choice: { type: "tool", name: "propose_meal_plan" },
    messages: [
      {
        role: "user",
        content: `Plan dinners for these 7 dates: ${dates.join(", ")}. Dietary notes / preferences: ${
          dietaryNotes || "none given, assume a typical omnivorous family"
        }.`,
      },
    ],
  });

  const toolUse = response.content.find((block): block is Anthropic.ToolUseBlock => block.type === "tool_use");
  const days = (toolUse?.input as { days: MealPlanDay[] } | undefined)?.days ?? [];

  return prisma.mealPlan.create({
    data: { householdId, weekStartDate, days: days as unknown as Prisma.InputJsonValue },
  });
}
