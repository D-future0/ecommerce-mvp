import getToken from "next-auth/middleware";
import { NextResponse, NextRequest } from "next/server";

export default async function proxy(req) {
  const token = await getToken({ req });
  const { pathname } = req.nextUrl;


  const isProtectedRoute =
    pathname.startsWith("/account") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout");

  const isAdminRoute = pathname.startsWith("/admin");

  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && (!token || token.role !== "admin")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/cart/:path*", "/checkout/:path*", "/admin/:path*"],
};
