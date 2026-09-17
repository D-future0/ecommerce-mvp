"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import type { ProductListItem } from "@/types/product";

export function ProductCarousel({ products }: { products: ProductListItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  if (!products.length) return null;

  function scroll(direction: number) {
    ref.current?.scrollBy({ left: direction * Math.max(ref.current.clientWidth * 0.8, 260), behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div ref={ref} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((product) => <div key={product._id} className="w-[min(42vw,13rem)] shrink-0 snap-start sm:w-52"><ProductCard product={product} /></div>)}
      </div>
      {products.length > 2 && <div className="absolute -top-12 right-0 flex gap-2"><button type="button" onClick={() => scroll(-1)} aria-label="Previous products" className="border border-line p-2 text-ink"><ChevronLeft size={16} /></button><button type="button" onClick={() => scroll(1)} aria-label="Next products" className="border border-line p-2 text-ink"><ChevronRight size={16} /></button></div>}
    </div>
  );
}
