"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="border border-line px-4 py-2 text-sm text-ink"
    >
      Sign out
    </button>
  );
}
