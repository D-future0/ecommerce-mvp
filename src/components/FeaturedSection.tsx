import { getFeaturedProducts } from "@/lib/products";
import { toPlain } from "@/lib/serialize";
import { ProductCard } from "@/components/ProductCard";
import type { ProductListItem } from "@/types/product";

export async function FeaturedSection() {
  const docs = await getFeaturedProducts(8);
  const products = toPlain<ProductListItem[]>(docs);

  if (!products.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h2 className="font-serif text-2xl">Featured</h2>
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}
