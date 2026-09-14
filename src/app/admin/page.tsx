export const dynamic = "force-dynamic";

import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { formatPrice } from "@/lib/format";

const LOW_STOCK_THRESHOLD = 5;

export default async function AdminDashboard() {
  await connectToDatabase();

  const [productCount, activeCount, pendingOrders, paidOrders, lowStock, revenueAgg] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments({ status: "pending" }),
    Order.countDocuments({ status: { $in: ["paid", "processing", "shipped", "delivered"] } }),
    Product.find({ stock: { $lte: LOW_STOCK_THRESHOLD }, isActive: true }).select("title stock slug").limit(10).lean(),
    Order.aggregate([
      { $match: { status: { $in: ["paid", "processing", "shipped", "delivered"] } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
  ]);

  const revenue = revenueAgg[0]?.total ?? 0;

  const stats = [
    { label: "Products", value: `${activeCount} / ${productCount}`, sub: "active / total" },
    { label: "Orders paid", value: paidOrders, sub: "all time" },
    { label: "Orders pending", value: pendingOrders, sub: "awaiting payment" },
    { label: "Revenue", value: formatPrice(revenue), sub: "from paid orders" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-line p-4">
            <p className="text-xs text-stone">{stat.label}</p>
            <p className="mt-2 text-2xl">{stat.value}</p>
            <p className="mt-1 text-xs text-stone">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="text-sm text-ink">Low stock (≤ {LOW_STOCK_THRESHOLD})</h2>
        {lowStock.length === 0 ? (
          <p className="mt-3 text-sm text-stone">Nothing running low.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {lowStock.map((p) => (
              <li key={p._id.toString()} className="flex items-center justify-between py-2.5 text-sm">
                <Link href={`/admin/products/${p._id}`} className="text-ink">
                  {p.title}
                </Link>
                <span className={p.stock === 0 ? "text-red-700" : "text-accent"}>{p.stock} left</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10 flex gap-4 text-sm">
        <Link href="/admin/products/new" className="bg-ink px-4 py-2 text-paper">
          New product
        </Link>
        <Link href="/admin/categories/new" className="border border-line px-4 py-2 text-ink">
          New category
        </Link>
      </div>
    </div>
  );
}
