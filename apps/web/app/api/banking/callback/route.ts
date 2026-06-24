import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForToken } from "@/lib/truelayer";
import { syncBankConnection } from "@/lib/banking";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get("tl_oauth_state")?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/dashboard?bank=invalid_state", request.url));
  }

  try {
    const tokens = await exchangeCodeForToken(code);
    const connection = await prisma.bankConnection.create({
      data: {
        householdId: session.householdId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    await syncBankConnection(connection.id);

    const response = NextResponse.redirect(new URL("/dashboard?bank=connected", request.url));
    response.cookies.set("tl_oauth_state", "", { path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    console.error("TrueLayer callback failed", error);
    return NextResponse.redirect(new URL("/dashboard?bank=error", request.url));
  }
}
