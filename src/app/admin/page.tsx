export const dynamic = "force-dynamic";

import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { formatPrice } from "@/lib/format";

const LOW_STOCK_THRESHOLD = 5;

export default async function AdminDashboard() {
  await connectToDatabase();

  const [productCount, activeCount, pendingOrders, paidOrders, lowStock, revenueAgg, userCount, recentUsers] = await Promise.all([
    Product.count(),
    Product.count({ where: { isActive: true } }),
    Order.count({ where: { status: "pending" } }),
    Order.count({ where: { status: { in: ["paid", "processing", "shipped", "delivered"] } } }),
    Product.findMany({
      where: { stock: { lte: LOW_STOCK_THRESHOLD }, isActive: true },
      select: { title: true, stock: true, slug: true, id: true },
      take: 10,
    }),
    Order.aggregate({
      where: { status: { in: ["paid", "processing", "shipped", "delivered"] } },
      _sum: { total: true },
    }),
    User.count(),
    User.findMany({
      select: { name: true, email: true, role: true, createdAt: true, id: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const revenue = revenueAgg._sum.total ?? 0;

  const stats = [
    { label: "Products", value: `${activeCount} / ${productCount}`, sub: "active / total" },
    { label: "Orders paid", value: paidOrders, sub: "all time" },
    { label: "Orders pending", value: pendingOrders, sub: "awaiting payment" },
    { label: "Users", value: userCount, sub: "all app users" },
    { label: "Revenue", value: formatPrice(revenue), sub: "from paid orders" },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-line bg-white/70 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.14em] text-stone">{stat.label}</p>
            <p className="mt-2 text-2xl font-medium">{stat.value}</p>
            <p className="mt-1 text-xs text-stone">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="border border-line bg-white/70 p-5 shadow-sm">
          <h2 className="text-sm text-ink">Low stock (≤ {LOW_STOCK_THRESHOLD})</h2>
          {lowStock.length === 0 ? (
            <p className="mt-3 text-sm text-stone">Nothing running low.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/admin/products/${p.id}`} className="text-ink">
                    {p.title}
                  </Link>
                  <span className={p.stock === 0 ? "text-red-700" : "text-accent"}>{p.stock} left</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border border-line bg-white/70 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm text-ink">Recent users</h2>
            <Link href="/admin/users" className="text-xs text-ink underline underline-offset-2">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {recentUsers.length === 0 ? (
              <p className="text-sm text-stone">No users yet.</p>
            ) : (
              recentUsers.map((user) => (
                <div key={user.id} className="border-b border-line pb-2 last:border-b-0 last:pb-0">
                  <p className="text-sm font-medium text-ink">{user.name || "Unnamed user"}</p>
                  <p className="text-xs text-stone">{user.email}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-stone">{user.role}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row text-sm">
        <Link href="/admin/products/new" className="bg-ink px-4 py-2 text-center text-paper">
          New product
        </Link>
        <Link href="/admin/categories/new" className="border border-line px-4 py-2 text-center text-ink">
          New category
        </Link>
        <Link href="/admin/collections/new" className="border border-line px-4 py-2 text-center text-ink">
          New collection
        </Link>
      </div>
    </div>
  );
}
