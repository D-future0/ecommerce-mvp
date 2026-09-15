export const dynamic = "force-dynamic";

import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { SignOutButton } from "@/components/SignOutButton";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null; // middleware redirects to /login before this renders

  await connectToDatabase();
  const user = await User.findById(session.user.id).lean();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl">My account</h1>
          <p className="mt-2 text-sm text-stone">{session.user.email}</p>
        </div>
        <div className="text-sm text-stone">
          {user?.name ? <span>{user.name}</span> : <span>Profile setup in progress</span>}
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Link href="/account/settings" className="block rounded border border-line p-5 transition hover:border-ink">
          <p className="text-xs uppercase tracking-[0.18em] text-stone">Account settings</p>
          <h2 className="mt-3 text-xl font-medium">Edit profile</h2>
          <p className="mt-2 text-sm text-stone">Update your email, phone numbers, password, and address details.</p>
        </Link>

        <Link href="/account/billing" className="block rounded border border-line p-5 transition hover:border-ink">
          <p className="text-xs uppercase tracking-[0.18em] text-stone">Billing</p>
          <h2 className="mt-3 text-xl font-medium">Billing address</h2>
          <p className="mt-2 text-sm text-stone">Manage the address used for invoices and billing-related checkout updates.</p>
        </Link>

        <Link href="/account/orders" className="block rounded border border-line p-5 transition hover:border-ink">
          <p className="text-xs uppercase tracking-[0.18em] text-stone">Orders</p>
          <h2 className="mt-3 text-xl font-medium">Track orders</h2>
          <p className="mt-2 text-sm text-stone">Review your order history and current delivery status.</p>
        </Link>

        <Link href="/account/wishlist" className="block rounded border border-line p-5 transition hover:border-ink">
          <p className="text-xs uppercase tracking-[0.18em] text-stone">Saved items</p>
          <h2 className="mt-3 text-xl font-medium">Wishlist</h2>
          <p className="mt-2 text-sm text-stone">Keep track of your favourite products and revisit them anytime.</p>
        </Link>
      </div>

      <div className="mt-8 space-y-3 text-sm">
        <Link href="/cart" className="block border-b border-line py-3 text-ink">
          Your bag
        </Link>
      </div>

      <div className="mt-8">
        <SignOutButton />
      </div>
    </main>
  );
}
