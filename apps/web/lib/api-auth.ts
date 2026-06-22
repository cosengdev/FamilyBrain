import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "./session";

type AuthResult = { session: SessionPayload; response?: undefined } | { session?: undefined; response: NextResponse };

export async function requireSession(): Promise<AuthResult> {
  const session = await getSession();
  if (!session) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}
