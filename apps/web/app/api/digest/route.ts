import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { buildDigest } from "@/lib/digest";

export async function GET() {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const digest = await buildDigest(auth.session.householdId);
  return NextResponse.json({ digest });
}
