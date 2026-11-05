"use client";

import { useState, Suspense } from "react";
import { getSession, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", { email, password, redirect: false });

      if (!res?.ok || res.error) {
        setError(res?.error ?? "We couldn't sign you in. Please try again.");
        return;
      }

      const session = await getSession();
      if (!session) {
        setError("We couldn't verify your sign-in. Please try again.");
        return;
      }

      const defaultDestination = session.user.role === "admin" ? "/admin" : "/";
      let destination = defaultDestination;
      if (callbackUrl) {
        const callback = new URL(callbackUrl, window.location.origin);
        const isAdminDestination =
          callback.pathname === "/admin" || callback.pathname.startsWith("/admin/");
        if (
          callback.origin === window.location.origin &&
          (session.user.role !== "admin" || isAdminDestination)
        ) {
          destination = `${callback.pathname}${callback.search}${callback.hash}`;
        }
      }

      window.location.assign(destination);
    } catch {
      setError("We couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-20">
      <h1 className="font-serif text-2xl">Sign in</h1>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="text-xs text-stone">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </div>
        <div>
          <label className="text-xs text-stone">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink py-2.5 text-sm text-paper disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-stone">
        No account?{" "}
        <Link href="/register" className="text-ink underline underline-offset-2">
          Create one
        </Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
