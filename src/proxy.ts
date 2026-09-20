import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";
import type { JWT } from "next-auth/jwt";

export default async function proxy(req: NextRequestWithAuth) {
  const token: JWT | null = await getToken({ req });
  const { pathname } = req.nextUrl;


  const isProtectedRoute =
    pathname.startsWith("/") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout");

  const isAdminRoute = pathname.startsWith("/admin");

  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && (!token || (token as any).role !== "admin")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/cart/:path*", "/checkout/:path*", "/admin/:path*"],
};
