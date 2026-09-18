export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getCartItems } from "@/lib/cart";
import { connectToDatabase } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { User } from "@/models/User";
import { CheckoutForm } from "@/components/CheckoutForm";

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null; // middleware handles the redirect

  const items = await getCartItems(session.user.id);
  if (items.length === 0) redirect("/cart");

  await connectToDatabase();
  const user = await User.findById(session.user.id).select("name email billingAddress").lean();

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const currency = items[0].currency;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl">Checkout</h1>

      <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-2">
        <CheckoutForm
          subtotal={subtotal}
          itemCount={itemCount}
          currency={currency}
          customerName={user?.name ?? session.user.name ?? ""}
          customerEmail={user?.email ?? session.user.email ?? ""}
          billingAddress={user?.billingAddress ?? null}
        />

        <div>
          <p className="mb-4 text-sm text-stone">Order summary</p>
          <div className="space-y-3 border-b border-line pb-4">
            {items.map((item) => (
              <div key={`${item.productId}-${item.variant ?? "default"}`} className="flex justify-between text-sm">
                <span>
                  {item.title}
                  {item.variant ? ` (${item.variant})` : ""} × {item.quantity}
                </span>
                <span>{formatPrice(item.price * item.quantity, item.currency)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between text-sm text-stone">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal, currency)}</span>
          </div>
          <p className="mt-2 text-xs text-stone">
            Delivery fees update when you choose a delivery method and location.
          </p>
        </div>
      </div>
    </main>
  );
}
