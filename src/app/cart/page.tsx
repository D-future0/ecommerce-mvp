export const dynamic = "force-dynamic";

import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCartItems } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { CartItemRow } from "@/components/CartItemRow";

export default async function CartPage() {
  const session = await getServerSession(authOptions);
  const items = session?.user ? await getCartItems(session.user.id) : [];

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const currency = items[0]?.currency ?? "NGN";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl">Your bag</h1>

      {items.length === 0 ? (
        <div className="mt-10 text-center text-stone">
          <p>Your bag is empty.</p>
          <Link href="/" className="mt-3 inline-block text-sm text-ink underline underline-offset-2">
            Continue shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8">
            {items.map((item) => (
              <CartItemRow key={`${item.productId}-${item.variant ?? "default"}`} item={item} />
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <span className="text-sm text-stone">Subtotal</span>
            <span className="text-lg text-ink">{formatPrice(subtotal, currency)}</span>
          </div>

          <Link
            href="/checkout"
            className="mt-6 block w-full bg-ink py-3 text-center text-sm text-paper"
          >
            Checkout
          </Link>
        </>
      )}
    </main>
  );
}
