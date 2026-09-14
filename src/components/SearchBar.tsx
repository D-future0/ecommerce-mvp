"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-xs">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search products"
        className="w-full border-b border-line bg-transparent py-1.5 text-sm outline-none focus:border-ink"
      />
    </form>
  );
}
