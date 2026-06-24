import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { syncBankConnection } from "@/lib/banking";

export async function POST() {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const connections = await prisma.bankConnection.findMany({
    where: { householdId: auth.session.householdId },
  });

  let totalSynced = 0;
  for (const connection of connections) {
    const { synced } = await syncBankConnection(connection.id);
    totalSynced += synced;
  }

  return NextResponse.json({ synced: totalSynced });
}
