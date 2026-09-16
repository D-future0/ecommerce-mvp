export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getProducts, SortOption } from "@/lib/products";
import { toPlain } from "@/lib/serialize";
import { ProductCard } from "@/components/ProductCard";
import { FilterSidebar } from "@/components/FilterSidebar";
import { SortSelect } from "@/components/SortSelect";
import { Pagination } from "@/components/Pagination";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { connectToDatabase } from "@/lib/db";
import type { ProductListItem } from "@/types/product";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const reserved = new Set(["q", "sort", "page", "minPrice", "maxPrice"]);
  const filters: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(sp)) {
    if (!reserved.has(key) && value) filters[key] = value.split(",").filter(Boolean);
  }

  const page = Math.max(Number(sp.page) || 1, 1);

  const result = await getProducts({
    categorySlug: slug,
    q: sp.q,
    sort: (sp.sort as SortOption) ?? "newest",
    page,
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    filters,
  });

  if (!result.category) notFound();

  await connectToDatabase();
  const [childCategories, databaseColors] = await Promise.all([
    Category.find({ parent: result.category._id }).sort({ name: 1 }).lean(),
    Product.distinct("attributes.color", { category: result.category._id, isActive: true }),
  ]);

  const category = toPlain<{
    name: string;
    description?: string;
    filters: { key: string; label: string; options: string[] }[];
  }>(
    result.category
  );
  const colors = databaseColors.filter((color): color is string => typeof color === "string" && color.trim().length > 0).sort();
  const hasColorFilter = category.filters.some((filter) => filter.key === "color");
  const filtersWithDatabaseColors = hasColorFilter
    ? category.filters.map((filter) => (filter.key === "color" ? { ...filter, options: colors } : filter))
    : colors.length > 0
      ? [...category.filters, { key: "color", label: "Color", options: colors }]
      : category.filters;
  const products = toPlain<ProductListItem[]>(result.products);

  const makeHref = (p: number) => {
    const params = new URLSearchParams(sp as Record<string, string>);
    params.set("page", String(p));
    return `/category/${slug}?${params.toString()}`;
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10 max-w-xl">
        <h1 className="font-serif text-3xl">{category.name}</h1>
        {category.description && <p className="mt-2 text-stone">{category.description}</p>}
        {childCategories.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {childCategories.map((child) => (
              <Link key={child.slug} href={`/category/${child.slug}`} className="border border-line px-3 py-1.5 text-sm text-stone hover:text-ink">
                {child.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[200px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <FilterSidebar filters={filtersWithDatabaseColors} />
        </aside>

        <div>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-stone">
              {result.total} {result.total === 1 ? "item" : "items"}
            </p>
            <SortSelect />
          </div>

          {products.length === 0 ? (
            <p className="py-20 text-center text-stone">No products match your filters.</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          <Pagination page={result.page} pages={result.pages} makeHref={makeHref} />
        </div>
      </div>
    </main>
  );
}
