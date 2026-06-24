import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { fetchAccounts, fetchTransactions, refreshAccessToken } from "./truelayer";

async function ensureValidToken(connection: {
  id: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
}): Promise<string> {
  if (connection.expiresAt.getTime() > Date.now() + 60_000) {
    return connection.accessToken;
  }
  if (!connection.refreshToken) {
    throw new Error("Bank connection has expired and has no refresh token");
  }
  const tokens = await refreshAccessToken(connection.refreshToken);
  const updated = await prisma.bankConnection.update({
    where: { id: connection.id },
    data: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? connection.refreshToken,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
  });
  return updated.accessToken;
}

export async function syncBankConnection(connectionId: string): Promise<{ synced: number }> {
  const connection = await prisma.bankConnection.findUnique({ where: { id: connectionId } });
  if (!connection) return { synced: 0 };

  const accessToken = await ensureValidToken(connection);
  const accounts = await fetchAccounts(accessToken);

  let synced = 0;
  for (const account of accounts) {
    const transactions = await fetchTransactions(accessToken, account.account_id);
    for (const t of transactions) {
      if (t.amount >= 0) continue; // only sync spend (debits); skip incoming credits

      try {
        await prisma.transaction.create({
          data: {
            householdId: connection.householdId,
            description: t.description || "Bank transaction",
            amount: Math.abs(t.amount),
            category: "OTHER",
            occurredAt: new Date(t.timestamp),
            source: "truelayer",
            externalId: t.transaction_id,
          },
        });
        synced++;
      } catch (err) {
        const isDuplicate = err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
        if (!isDuplicate) throw err;
      }
    }
  }

  await prisma.bankConnection.update({ where: { id: connectionId }, data: { lastSyncedAt: new Date() } });
  return { synced };
}
