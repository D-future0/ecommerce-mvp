"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const OPTIONS: { value: string; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most popular" },
  { value: "rating", label: "Top rated" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("sort") ?? "newest";

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    value === "newest" ? params.delete("sort") : params.set("sort", value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={current}
      onChange={(e) => onChange(e.target.value)}
      className="border border-line bg-transparent px-2 py-1.5 text-sm outline-none focus:border-ink"
      aria-label="Sort products"
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
