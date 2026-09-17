"use client";

import { useEffect, useState } from "react";
import { ProductCarousel } from "@/components/ProductCarousel";
import type { ProductListItem } from "@/types/product";

export function RecentlyViewed() {
  const [products, setProducts] = useState<ProductListItem[]>([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch("/api/account/recently-viewed");
        if (!response.ok) return;
        const data = (await response.json()) as { products?: ProductListItem[] };
        if (active) setProducts(data.products ?? []);
      } catch {
        // Recently viewed is optional and should never block the storefront.
      }
    };

    load();
    window.addEventListener("recently-viewed-updated", load);
    return () => {
      active = false;
      window.removeEventListener("recently-viewed-updated", load);
    };
  }, []);

  if (!products.length) return null;

  return (
    <section className="border-t border-line bg-paper py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-stone">Your browsing history</p>
            <h2 className="mt-2 font-serif text-2xl text-ink">Recently viewed</h2>
          </div>
        </div>
        <div className="mt-8"><ProductCarousel products={products} /></div>
      </div>
    </section>
  );
}
