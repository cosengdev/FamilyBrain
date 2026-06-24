import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireSession } from "@/lib/api-auth";
import { buildAuthUrl } from "@/lib/truelayer";

export async function GET() {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const state = randomUUID();
  const response = NextResponse.redirect(buildAuthUrl(state));
  response.cookies.set("tl_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
