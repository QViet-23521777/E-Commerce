const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";
const KIND_KEY = "auth_kind";

export type AuthKind = "user" | "shop" | "admin";

const COOKIE_BY_KIND: Record<AuthKind, string> = {
  user: "auth_token",
  shop: "shop_token",
  admin: "admin_token",
};

function setCookie(name: string, value: string, maxAgeSeconds = 60 * 60 * 24 * 7) {
  if (typeof document === "undefined") return;
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function saveTokens(access: string, refresh: string, kind?: AuthKind) {
  const effectiveKind: AuthKind = kind ?? (getAuthKind() ?? "user");
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
  localStorage.setItem(KIND_KEY, effectiveKind);
  // Mirror the access token into the cookie the Next.js middleware checks so
  // protected routes (/profile, /orders, /shop, /admin) actually let us in.
  setCookie(COOKIE_BY_KIND[effectiveKind], access);
}

export function getAuthKind(): AuthKind | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(KIND_KEY);
  return v === "user" || v === "shop" || v === "admin" ? v : null;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(KIND_KEY);
  clearCookie(COOKIE_BY_KIND.user);
  clearCookie(COOKIE_BY_KIND.shop);
  clearCookie(COOKIE_BY_KIND.admin);
}

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
  name?: string;
}

export function getUser(): AuthUser | null {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      userId: payload.userId ?? payload.sub,
      email: payload.email,
      role: payload.role ?? "user",
      name: payload.name,
    };
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return getUser() !== null;
}
