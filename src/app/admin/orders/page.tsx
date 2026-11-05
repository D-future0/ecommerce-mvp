export const dynamic = "force-dynamic";

import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import { formatPrice } from "@/lib/format";

const STATUS_COLOR: Record<string, string> = {
  pending: "text-stone",
  paid: "text-accent",
  processing: "text-accent",
  shipped: "text-accent",
  delivered: "text-accent",
  cancelled: "text-red-700",
  refunded: "text-red-700",
};

export default async function AdminOrdersPage() {
  await connectToDatabase();
  const rows = await Order.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { userRef: { select: { name: true, email: true } } },
  });
  const orders = rows.map(({ userRef, ...order }) => ({ ...order, user: userRef }));

  return (
    <div>
      <h2 className="text-sm text-ink">{orders.length} orders</h2>

      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs text-stone">
            <th className="pb-2 font-normal">Reference</th>
            <th className="pb-2 font-normal">Customer</th>
            <th className="pb-2 font-normal">Total</th>
            <th className="pb-2 font-normal">Status</th>
            <th className="pb-2 font-normal">Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-line">
              <td className="py-3">
                <Link href={`/admin/orders/${o.id}`} className="text-ink">
                  {o.paystackReference}
                </Link>
              </td>
              <td className="py-3 text-stone">{(o.user as any)?.email ?? "—"}</td>
              <td className="py-3">{formatPrice(o.total, o.currency)}</td>
              <td className={`py-3 ${STATUS_COLOR[o.status] ?? ""}`}>{o.status}</td>
              <td className="py-3 text-stone">{new Date(o.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {orders.length === 0 && <p className="mt-6 text-sm text-stone">No orders yet.</p>}
    </div>
  );
}
