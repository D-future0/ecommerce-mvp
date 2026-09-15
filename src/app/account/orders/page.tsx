export const dynamic = "force-dynamic";

import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import { formatPrice } from "@/lib/format";

const statusStyles: Record<string, string> = {
  pending: "bg-stone-100 text-stone-700",
  paid: "bg-emerald-100 text-emerald-700",
  processing: "bg-amber-100 text-amber-700",
  shipped: "bg-sky-100 text-sky-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-violet-100 text-violet-700",
};

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  await connectToDatabase();
  const orders = await Order.find({ user: session.user.id }).sort({ createdAt: -1 }).lean();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-stone">Orders</p>
          <h1 className="mt-2 font-serif text-3xl">Order history</h1>
        </div>
        <Link href="/account" className="text-sm text-ink underline underline-offset-2">
          Back to account
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="rounded border border-line p-8 text-center text-stone">
          <p>You have no orders yet.</p>
          <Link href="/" className="mt-3 inline-block text-sm text-ink underline underline-offset-2">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={String(order._id)} className="rounded border border-line p-5">
              <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-stone">Order #{String(order.paystackReference).slice(-8)}</p>
                  <p className="mt-2 text-sm text-stone">
                    {new Date(order.createdAt).toLocaleDateString("en-NG", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[order.status] ?? statusStyles.pending}`}>
                    {order.status}
                  </span>
                  <span className="text-lg font-medium">{formatPrice(order.total, order.currency)}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-stone">
                <p>
                  {order.items.length} item{order.items.length === 1 ? "" : "s"}
                </p>
                <p>
                  Delivery: {order.shippingAddress.line1}
                  {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}, {order.shippingAddress.city}, {order.shippingAddress.state}
                </p>
                <p>Tracking status: {order.status}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
