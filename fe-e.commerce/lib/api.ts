import { getAccessToken, getRefreshToken, saveTokens, clearTokens, currentKind } from "./auth";

const LOGIN_BY_KIND = {
  user: "/login",
  shop: "/shop/login",
  admin: "/admin/login",
} as const;

const _envUrl = process.env.NEXT_PUBLIC_API_URL;
const BASE = _envUrl && _envUrl.startsWith("http") ? _envUrl : "http://localhost:3000";

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const res = await fetch(`${BASE}/api/users/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) { clearTokens(); return null; }
    const data = await res.json();
    const newAccess: string = data.data?.accessToken ?? data.accessToken ?? data.token;
    const newRefresh: string = data.data?.refreshToken ?? data.refreshToken ?? refresh;
    saveTokens(newAccess, newRefresh);
    return newAccess;
  } catch {
    return null;
  }
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {},
  _retry = true,
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401 && _retry) {
    const newToken = await refreshAccessToken();
    if (newToken) return apiRequest<T>(path, options, false);
    clearTokens();
    if (typeof window !== "undefined") {
      window.location.href = LOGIN_BY_KIND[currentKind()];
    }
    throw new Error("Session expired");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, ...(typeof data === "object" ? data : { message: data }) };
  return data as T;
}
