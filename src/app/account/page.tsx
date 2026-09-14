export const dynamic = "force-dynamic";

import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null; // middleware redirects to /login before this renders

  return (
    <main className="mx-auto max-w-lg px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl">Account</h1>
      <p className="mt-2 text-sm text-stone">{session.user.email}</p>

      <div className="mt-8 space-y-3 text-sm">
        <Link href="/cart" className="block border-b border-line py-3 text-ink">
          Your bag
        </Link>
        <Link href="/account/wishlist" className="block border-b border-line py-3 text-ink">
          Wishlist
        </Link>
      </div>

      <div className="mt-8">
        <SignOutButton />
      </div>
    </main>
  );
}
