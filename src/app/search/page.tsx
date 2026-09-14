export const dynamic = "force-dynamic";

import { getProducts, SortOption } from "@/lib/products";
import { toPlain } from "@/lib/serialize";
import { ProductCard } from "@/components/ProductCard";
import { SortSelect } from "@/components/SortSelect";
import { Pagination } from "@/components/Pagination";
import type { ProductListItem } from "@/types/product";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(Number(sp.page) || 1, 1);

  const result = await getProducts({
    q: sp.q,
    sort: (sp.sort as SortOption) ?? "newest",
    page,
  });

  const products = toPlain<ProductListItem[]>(result.products);

  const makeHref = (p: number) => {
    const params = new URLSearchParams(sp as Record<string, string>);
    params.set("page", String(p));
    return `/search?${params.toString()}`;
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="font-serif text-3xl">
          {sp.q ? `Results for “${sp.q}”` : "Search"}
        </h1>
        <p className="mt-2 text-sm text-stone">
          {result.total} {result.total === 1 ? "item" : "items"}
        </p>
      </div>

      <div className="mb-6 flex justify-end">
        <SortSelect />
      </div>

      {products.length === 0 ? (
        <p className="py-20 text-center text-stone">
          {sp.q ? "No products matched your search." : "Type something to search the catalog."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      <Pagination page={result.page} pages={result.pages} makeHref={makeHref} />
    </main>
  );
}
