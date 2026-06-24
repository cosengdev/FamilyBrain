const AUTH_BASE = "https://auth.truelayer-sandbox.com";
const API_BASE = "https://api.truelayer-sandbox.com";

function config() {
  const clientId = process.env.TRUELAYER_CLIENT_ID;
  const clientSecret = process.env.TRUELAYER_CLIENT_SECRET;
  const redirectUri = process.env.TRUELAYER_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("TrueLayer environment variables are not set");
  }
  return { clientId, clientSecret, redirectUri };
}

export function buildAuthUrl(state: string): string {
  const { clientId, redirectUri } = config();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "info accounts balance transactions offline_access",
    providers: "uk-cs-mock",
    state,
  });
  return `${AUTH_BASE}/?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

async function requestToken(body: URLSearchParams): Promise<TokenResponse> {
  const res = await fetch(`${AUTH_BASE}/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`TrueLayer token request failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const { clientId, clientSecret, redirectUri } = config();
  return requestToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    })
  );
}

export function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const { clientId, clientSecret } = config();
  return requestToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    })
  );
}

export interface TrueLayerAccount {
  account_id: string;
  display_name: string;
}

export async function fetchAccounts(accessToken: string): Promise<TrueLayerAccount[]> {
  const res = await fetch(`${API_BASE}/data/v1/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`TrueLayer accounts fetch failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.results ?? [];
}

export interface TrueLayerTransaction {
  transaction_id: string;
  amount: number;
  description: string;
  timestamp: string;
}

export async function fetchTransactions(accessToken: string, accountId: string): Promise<TrueLayerTransaction[]> {
  const res = await fetch(`${API_BASE}/data/v1/accounts/${accountId}/transactions`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`TrueLayer transactions fetch failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.results ?? [];
}
