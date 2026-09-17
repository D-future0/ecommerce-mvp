import { ProductCarousel } from "@/components/ProductCarousel";
import type { ProductListItem } from "@/types/product";

export function RelatedProducts({ products }: { products: ProductListItem[] }) {
  if (!products.length) return null;

  return (
    <section className="mt-20 border-t border-line pt-10">
      <h2 className="font-serif text-2xl">You may also like</h2>
      <div className="mt-6"><ProductCarousel products={products} /></div>
    </section>
  );
}
