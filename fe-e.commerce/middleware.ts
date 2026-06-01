import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/profile", "/orders", "/checkout", "/chat"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin hub protection
  if (pathname.startsWith("/admin/") && !pathname.startsWith("/admin/login")) {
    if (!request.cookies.get("admin_token")) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Shop hub protection
  if (pathname.startsWith("/shop/") && !pathname.startsWith("/shop/login")) {
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
