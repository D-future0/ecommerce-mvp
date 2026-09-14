import { ProductCard } from "@/components/ProductCard";
import type { ProductListItem } from "@/types/product";

export function RelatedProducts({ products }: { products: ProductListItem[] }) {
  if (!products.length) return null;

  return (
    <section className="mt-20 border-t border-line pt-10">
      <h2 className="font-serif text-2xl">You may also like</h2>
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}
