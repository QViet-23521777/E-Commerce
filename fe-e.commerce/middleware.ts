import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/profile", "/orders", "/checkout", "/chat"];
const ADMIN_PUBLIC = ["/admin/login", "/admin/register", "/admin/verify"];

function getJwtRole(token: string): string | null {
  try {
    const b64 = token.split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const padded = b64.padEnd(b64.length + (4 - (b64.length % 4)) % 4, "=");
    const payload = JSON.parse(atob(padded));
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin hub protection
  if (
    pathname.startsWith("/admin/") &&
    !ADMIN_PUBLIC.some((p) => pathname.startsWith(p))
  ) {
    const adminToken = request.cookies.get("admin_token")?.value;

    if (!adminToken) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // Verify the token encodes an admin or superadmin role
    const role = getJwtRole(adminToken);
    if (role !== "admin" && role !== "superadmin") {
      const res = NextResponse.redirect(new URL("/admin/login", request.url));
      res.cookies.delete("admin_token");
      return res;
    }
  }

  // Shop hub protection
  if (
    pathname.startsWith("/shop/") &&
    !pathname.startsWith("/shop/login") &&
    !pathname.startsWith("/shop/signup")
  ) {
    if (!request.cookies.get("shop_token")) {
      return NextResponse.redirect(new URL("/shop/login", request.url));
    }
  }

  // Buyer-side protected routes
  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (isProtected && !request.cookies.get("auth_token")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/orders/:path*",
    "/checkout/:path*",
    "/chat/:path*",
    "/admin/:path*",
    "/shop/:path*",
  ],
};
