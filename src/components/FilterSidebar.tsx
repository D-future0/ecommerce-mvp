"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

interface FilterDef {
  key: string;
  label: string;
  options: string[];
}

export function FilterSidebar({ filters }: { filters: FilterDef[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");

  const pushParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      params.delete("page"); // any filter change resets pagination
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    },
    [router, pathname, searchParams]
  );

  function toggleOption(key: string, value: string) {
    pushParams((params) => {
      const current = new Set(params.get(key)?.split(",").filter(Boolean));
      current.has(value) ? current.delete(value) : current.add(value);
      current.size ? params.set(key, [...current].join(",")) : params.delete(key);
    });
  }

  function applyPriceRange() {
    pushParams((params) => {
      minPrice ? params.set("minPrice", minPrice) : params.delete("minPrice");
      maxPrice ? params.set("maxPrice", maxPrice) : params.delete("maxPrice");
    });
  }

  function clearAll() {
    setMinPrice("");
    setMaxPrice("");
    startTransition(() => router.push(pathname));
  }

  const hasActiveFilters =
    filters.some((f) => searchParams.get(f.key)) || searchParams.get("minPrice") || searchParams.get("maxPrice");

  return (
    <div className={`space-y-8 ${isPending ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm text-ink">Filter</h2>
        {hasActiveFilters && (
          <button onClick={clearAll} className="text-xs text-stone underline underline-offset-2">
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-3 border-t border-line pt-4">
        <p className="text-xs text-stone">Price</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={applyPriceRange}
            className="w-full border border-line bg-transparent px-2 py-1.5 text-sm outline-none focus:border-ink"
          />
          <span className="text-stone">—</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={applyPriceRange}
            className="w-full border border-line bg-transparent px-2 py-1.5 text-sm outline-none focus:border-ink"
          />
        </div>
      </div>

      {filters.map((filter) => {
        const selected = new Set(searchParams.get(filter.key)?.split(",").filter(Boolean));
        return (
          <div key={filter.key} className="space-y-3 border-t border-line pt-4">
            <p className="text-xs text-stone">{filter.label}</p>
            <div className="space-y-2">
              {filter.options.map((option) => (
                <label key={option} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.has(option)}
                    onChange={() => toggleOption(filter.key, option)}
                    className="h-3.5 w-3.5 accent-accent"
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
