import { getFeaturedProducts } from "@/lib/products";
import { toPlain } from "@/lib/serialize";
import { ProductCard } from "@/components/ProductCard";
import type { ProductListItem } from "@/types/product";

interface FeaturedSectionProps {
  title?: string;
  products?: ProductListItem[];
  theme?: "purple" | "rose" | "slate" | "emerald" | "gold";
  displayMode?: "grid" | "carousel";
}

const themeClasses = {
  purple: "bg-violet-50 border-violet-200 text-violet-900",
  rose: "bg-rose-50 border-rose-200 text-rose-900",
  slate: "bg-slate-100 border-slate-200 text-slate-900",
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
  gold: "bg-amber-50 border-amber-200 text-amber-900",
};

export async function FeaturedSection({ title = "Featured collection", products, theme = "purple", displayMode = "grid" }: FeaturedSectionProps = {}) {
  const docs = products ?? (await getFeaturedProducts(8));
  const list = toPlain<ProductListItem[]>(docs);

  if (!list.length) return null;

  return (
    <section className={`mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 ${themeClasses[theme]}`}>
      <div className="rounded-2xl border p-4 sm:p-6">
        <h2 className="font-serif text-2xl">{title}</h2>
        {displayMode === "carousel" ? (
          <div className="mt-8 flex gap-4 overflow-x-auto pb-2">
            {list.map((product) => (
              <div key={product._id} className="min-w-[260px] flex-1 max-w-[280px]">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {list.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
