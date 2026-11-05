export const dynamic = "force-dynamic";

import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { parseCategoryFilters } from "@/lib/category-data";

export default async function AdminCategoriesPage() {
  await connectToDatabase();
  const [categoryRows, counts] = await Promise.all([
    Category.findMany({ orderBy: { name: "asc" } }),
    Product.groupBy({ by: ["category"], _count: { _all: true } }),
  ]);
  const categories = categoryRows.map((category) => ({
    ...category,
    filters: parseCategoryFilters(category.filters),
  }));
  const countMap = new Map(counts.map((count) => [count.category, count._count._all]));
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
            <tr key={c.id} className="border-b border-line">
              <td className="py-3">
                <Link href={`/admin/categories/${c.id}`} className="text-ink">
                  {c.parent ? <span className="text-stone">↳ </span> : null}{c.name}
                </Link>
              </td>
              <td className="py-3 text-stone">{c.slug}</td>
              <td className="py-3 text-stone">{c.filters.length}</td>
              <td className="py-3 text-stone">{countMap.get(c.id.toString()) ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {categories.length === 0 && <p className="mt-6 text-sm text-stone">No categories yet.</p>}

    </div>
  );
}
