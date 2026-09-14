export const dynamic = "force-dynamic";

import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";
import { formatPrice } from "@/lib/format";

export default async function AdminProductsPage() {
  await connectToDatabase();
  const products = await Product.find().sort({ createdAt: -1 }).populate("category", "name").lean();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm text-ink">{products.length} products</h2>
        <Link href="/admin/products/new" className="bg-ink px-4 py-2 text-sm text-paper">
          New product
        </Link>
      </div>

      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs text-stone">
            <th className="pb-2 font-normal">Title</th>
            <th className="pb-2 font-normal">Category</th>
            <th className="pb-2 font-normal">Price</th>
            <th className="pb-2 font-normal">Stock</th>
            <th className="pb-2 font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p._id.toString()} className="border-b border-line">
              <td className="py-3">
                <Link href={`/admin/products/${p._id}`} className="text-ink">
                  {p.title}
                </Link>
              </td>
              <td className="py-3 text-stone">{(p.category as any)?.name ?? "—"}</td>
              <td className="py-3">{formatPrice(p.price, p.currency)}</td>
              <td className={`py-3 ${p.stock === 0 ? "text-red-700" : ""}`}>{p.stock}</td>
              <td className="py-3">
                <span className={p.isActive ? "text-accent" : "text-stone"}>
                  {p.isActive ? "Active" : "Hidden"}
                </span>
                {p.featured && <span className="ml-2 text-xs text-stone">· Featured</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {products.length === 0 && <p className="mt-6 text-sm text-stone">No products yet.</p>}
    </div>
  );
}
