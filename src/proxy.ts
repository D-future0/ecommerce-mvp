import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const middleware = withAuth(
  function middleware(req) {
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
    const role = req.nextauth.token?.role;
    console.log("[Middleware] Request to:", req.nextUrl.pathname, "Token present:", !!req.nextauth.token);

    if (isAdminRoute && role !== "admin") {
      console.log("[Middleware] Admin access denied for:", req.nextUrl.pathname);
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const authorized = !!token;
        console.log("[Middleware] Authorized:", authorized, "Path:", req.nextUrl.pathname);
        return authorized;
      },
    },
  }
);

export default middleware;

export const config = {
  matcher: ["/account/:path*", "/cart/:path*", "/checkout/:path*", "/admin/:path*"],
};
