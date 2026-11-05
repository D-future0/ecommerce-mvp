import { getToken } from "next-auth/jwt";
import { NextResponse, NextRequest } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";
import type { JWT } from "next-auth/jwt";

export default async function proxy(req: NextRequestWithAuth) {
  const token: JWT | null = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;
  const cookies = req.headers.get("cookie") || "";

  console.log("[Proxy] Path:", pathname);
  console.log("[Proxy] NEXTAUTH_SECRET set:", !!process.env.NEXTAUTH_SECRET);
  console.log("[Proxy] Token present:", !!token);
  console.log("[Proxy] Cookies:", cookies.substring(0, 200));

  const isProtectedRoute =
    pathname.startsWith("/account") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout");

  const isAdminRoute = pathname.startsWith("/admin");

  if (isProtectedRoute && !token) {
    console.log("[Proxy] No token — redirecting to login");
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && (!token || (token as any).role !== "admin")) {
    console.log("[Proxy] Not admin — redirecting to home");
    return NextResponse.redirect(new URL("/", req.url));
  }

  console.log("[Proxy] Access granted");
  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/cart/:path*", "/checkout/:path*", "/admin/:path*"],
};
