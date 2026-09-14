"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Couldn't create your account.");
      setLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", { email, password, redirect: false });
    if (signInRes?.error) {
      router.push("/login");
      return;
    }

    router.push("/account");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-20">
      <h1 className="font-serif text-2xl">Create an account</h1>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="text-xs text-stone">Name</label>
          <input
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </div>
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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
          />
          <p className="mt-1 text-xs text-stone">At least 8 characters.</p>
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink py-2.5 text-sm text-paper disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-stone">
        Already have an account?{" "}
        <Link href="/login" className="text-ink underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </main>
  );
}
