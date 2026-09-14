export const dynamic = "force-dynamic";

import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";

export default async function AdminCategoriesPage() {
  await connectToDatabase();
  const categories = await Category.find().sort({ name: 1 }).lean();
  const counts = await Product.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]);
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm text-ink">{categories.length} categories</h2>
        <Link href="/admin/categories/new" className="bg-ink px-4 py-2 text-sm text-paper">
          New category
        </Link>
      </div>

      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs text-stone">
            <th className="pb-2 font-normal">Name</th>
            <th className="pb-2 font-normal">Slug</th>
            <th className="pb-2 font-normal">Filters</th>
            <th className="pb-2 font-normal">Products</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c._id.toString()} className="border-b border-line">
              <td className="py-3">
                <Link href={`/admin/categories/${c._id}`} className="text-ink">
                  {c.parent ? <span className="text-stone">↳ </span> : null}{c.name}
                </Link>
              </td>
              <td className="py-3 text-stone">{c.slug}</td>
              <td className="py-3 text-stone">{c.filters.length}</td>
              <td className="py-3 text-stone">{countMap.get(c._id.toString()) ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {categories.length === 0 && <p className="mt-6 text-sm text-stone">No categories yet.</p>}
    </div>
  );
}
