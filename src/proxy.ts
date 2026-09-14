import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
    const role = req.nextauth.token?.role;

    if (isAdminRoute && role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/account/:path*", "/cart/:path*", "/checkout/:path*", "/admin/:path*"],
};
