import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { rateLimit } from "@/lib/redis";

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // Throttle login attempts per email to slow down credential stuffing.
        let rateLimited = false;
        try {
          const { success } = await rateLimit(
            `login:${credentials.email.toLowerCase()}`,
            10,
            60 * 15
          );
          rateLimited = !success;
        } catch {
          rateLimited = false;
        }
        if (rateLimited) {
          throw new Error("Too many login attempts. Try again in a few minutes.");
        }

        await connectToDatabase();

        const user = await User.findOne({ email: credentials.email.toLowerCase() }).select(
          "+passwordHash"
        );
        if (!user) throw new Error("Invalid email or password");
        if (user.isDeactivated) throw new Error("This account has been deactivated.");

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) throw new Error("Invalid email or password");

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
};
