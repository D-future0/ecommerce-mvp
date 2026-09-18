"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface SuggestionProduct {
  title: string;
  slug: string;
  price: number;
  currency: string;
  images?: string[];
}

interface SuggestionCategory {
  name: string;
  slug: string;
}

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [products, setProducts] = useState<SuggestionProduct[]>([]);
  const [categories, setCategories] = useState<SuggestionCategory[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setProducts([]);
      setCategories([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = await response.json();
        setProducts(data.products ?? []);
        setCategories(data.categories ?? []);
        setFocusedIndex(-1);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setProducts([]);
          setCategories([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [value]);

  const suggestionCount = categories.length + products.length;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    setOpen(false);
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown" && suggestionCount > 0) {
      e.preventDefault();
      setFocusedIndex((current) => (current + 1) % suggestionCount);
    }
    if (e.key === "ArrowUp" && suggestionCount > 0) {
      e.preventDefault();
      setFocusedIndex((current) => (current - 1 + suggestionCount) % suggestionCount);
    }
    if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault();
      const category = categories[focusedIndex];
      if (category) {
        router.push(`/category/${category.slug}`);
      } else {
        const product = products[focusedIndex - categories.length];
        if (product) router.push(`/product/${product.slug}`);
      }
      setOpen(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="relative w-full max-w-xs">
      <input
        type="search"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimeout.current = setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={onKeyDown}
        placeholder="Search products"
        aria-label="Search products"
        aria-autocomplete="list"
        aria-expanded={open && suggestionCount > 0}
        className="w-full border-b border-line bg-transparent py-1.5 text-sm outline-none focus:border-ink"
      />

      {open && value.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 border border-line bg-paper shadow-lg">
          {loading ? (
            <p className="px-4 py-3 text-sm text-stone">Searching…</p>
          ) : suggestionCount === 0 ? (
            <button type="submit" className="w-full px-4 py-3 text-left text-sm text-stone hover:bg-line/30">
              Search for “{value.trim()}”
            </button>
          ) : (
            <>
              {categories.length > 0 && <p className="px-4 pt-3 text-[10px] uppercase tracking-[0.16em] text-stone">Categories</p>}
              {categories.map((category, index) => (
                <button
                  key={category.slug}
                  type="button"
                  onMouseDown={() => clearTimeout(blurTimeout.current ?? undefined)}
                  onClick={() => {
                    router.push(`/category/${category.slug}`);
                    setOpen(false);
                  }}
                  className={`block w-full px-4 py-2 text-left text-sm ${focusedIndex === index ? "bg-line/40" : "hover:bg-line/30"}`}
                >
                  {category.name}
                </button>
              ))}
              {products.length > 0 && <p className="px-4 pt-3 text-[10px] uppercase tracking-[0.16em] text-stone">Products</p>}
              {products.map((product, index) => (
                <button
                  key={product.slug}
                  type="button"
                  onMouseDown={() => clearTimeout(blurTimeout.current ?? undefined)}
                  onClick={() => {
                    router.push(`/product/${product.slug}`);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm ${focusedIndex === categories.length + index ? "bg-line/40" : "hover:bg-line/30"}`}
                >
                  {product.images?.[0] && <img src={product.images[0]} alt="" className="h-9 w-9 object-cover" />}
                  <span className="min-w-0 flex-1 truncate">{product.title}</span>
                </button>
              ))}
              <button type="submit" className="w-full border-t border-line px-4 py-3 text-left text-sm text-stone hover:bg-line/30">
                See all results for “{value.trim()}”
              </button>
            </>
          )}
        </div>
      )}
    </form>
  );
}
