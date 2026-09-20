import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

console.log("[NextAuth] Handler called, NEXTAUTH_URL:", process.env.NEXTAUTH_URL, "NEXTAUTH_SECRET set:", !!process.env.NEXTAUTH_SECRET);

const handler = NextAuth(authOptions);

console.log("[NextAuth] Handler created");

export { handler as GET, handler as POST };
