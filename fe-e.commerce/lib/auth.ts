// Auth storage is partitioned per "kind" (buyer / shop / admin) so the three
// portals can be signed in simultaneously in the same browser. The active kind
// is derived from the URL path, NOT from a stored value — logging into the shop
// portal must never clobber a buyer session, and re-logging in on /login must
// always write the buyer slot regardless of what was logged in before.

export type AuthKind = "user" | "shop" | "admin";

const COOKIE_BY_KIND: Record<AuthKind, string> = {
  user: "auth_token",
  shop: "shop_token",
  admin: "admin_token",
};

const accessKey = (kind: AuthKind) => `access_token_${kind}`;
const refreshKey = (kind: AuthKind) => `refresh_token_${kind}`;

// Which portal a given path belongs to. Everything outside /shop and /admin is
// the buyer storefront.
export function kindFromPath(path: string): AuthKind {
  if (path === "/shop" || path.startsWith("/shop/")) return "shop";
  if (path === "/admin" || path.startsWith("/admin/")) return "admin";
  return "user";
}

/** The auth kind for the page currently being viewed. */
export function currentKind(): AuthKind {
  if (typeof window === "undefined") return "user";
  return kindFromPath(window.location.pathname);
}

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
  const effectiveKind: AuthKind = kind ?? currentKind();
  localStorage.setItem(accessKey(effectiveKind), access);
  localStorage.setItem(refreshKey(effectiveKind), refresh);
  // Mirror the access token into the cookie the Next.js middleware checks so
  // protected routes (/profile, /orders, /shop, /admin) actually let us in.
  setCookie(COOKIE_BY_KIND[effectiveKind], access);
}

/** The kind currently signed in for this page, or null if not signed in. */
export function getAuthKind(): AuthKind | null {
  const kind = currentKind();
  return getAccessTokenFor(kind) ? kind : null;
}

function getAccessTokenFor(kind: AuthKind): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(accessKey(kind));
}

export function getAccessToken(): string | null {
  return getAccessTokenFor(currentKind());
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(refreshKey(currentKind()));
}

/** Clears only the session for the current portal (default) or a given kind. */
export function clearTokens(kind?: AuthKind) {
  const target: AuthKind = kind ?? currentKind();
  localStorage.removeItem(accessKey(target));
  localStorage.removeItem(refreshKey(target));
  clearCookie(COOKIE_BY_KIND[target]);
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

/**
 * Decode just the `role` claim from a raw JWT string (base64url-safe). No
 * signature verification — this is UI-side gating only, the gateway re-checks
 * the role on every request. Used by the shop login page to refuse a non-seller
 * account before its token is written into the shop slot.
 */
export function roleFromToken(token: string): string | null {
  try {
    const b64 = token
      .split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(padded));
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}
