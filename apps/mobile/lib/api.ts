import * as SecureStore from "expo-secure-store";

// Android emulator: use http://10.0.2.2:3000. Physical device: use your machine's LAN IP.
// Override by setting EXPO_PUBLIC_API_URL before running `expo start`.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

const TOKEN_KEY = "familybrain_token";

export function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export function setToken(token: string) {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export function clearToken() {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
}
