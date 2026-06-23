import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { buildBudgetSummary } from "@/lib/budget";

export async function GET() {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const summary = await buildBudgetSummary(auth.session.householdId);
  return NextResponse.json({ summary });
}
