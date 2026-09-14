export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getProducts, SortOption } from "@/lib/products";
import { toPlain } from "@/lib/serialize";
import { ProductCard } from "@/components/ProductCard";
import { FilterSidebar } from "@/components/FilterSidebar";
import { SortSelect } from "@/components/SortSelect";
import { Pagination } from "@/components/Pagination";
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

  const category = toPlain<{ name: string; description?: string; filters: { key: string; label: string; options: string[] }[] }>(
    result.category
  );
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
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[200px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <FilterSidebar filters={category.filters ?? []} />
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
