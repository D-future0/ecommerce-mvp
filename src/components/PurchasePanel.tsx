"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { formatPrice } from "@/lib/format";

interface Variant {
  name: string;
  value: string;
  priceDelta?: number;
  stock: number;
  sku: string;
}

export function PurchasePanel({
  productId,
  basePrice,
  currency,
  variants,
  initiallyWishlisted = false,
}: {
  productId: string;
  basePrice: number;
  currency: string;
  variants: Variant[];
  initiallyWishlisted?: boolean;
}) {
  const { status } = useSession();
  const router = useRouter();

  const groups = useMemo(() => {
    const byName = new Map<string, Variant[]>();
    for (const v of variants) {
      if (!byName.has(v.name)) byName.set(v.name, []);
      byName.get(v.name)!.push(v);
    }
    return [...byName.entries()];
  }, [variants]);

  const [selected, setSelected] = useState<Record<string, string>>({});
  const [wishlisted, setWishlisted] = useState(initiallyWishlisted);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");

  const activeVariant = variants.find((v) =>
    groups.every(([name]) => selected[name] === undefined || selected[name] === v.value)
  );

  const price = basePrice + (activeVariant?.priceDelta ?? 0);
  const outOfStock = activeVariant ? activeVariant.stock <= 0 : false;
  const needsSelection = groups.length > 0 && groups.some(([name]) => !selected[name]);

  function requireAuth() {
    if (status === "authenticated") return true;
    router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
    return false;
  }

  async function addToBag() {
    if (!requireAuth()) return;
    setAdding(true);
    setMessage("");

    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, variant: activeVariant?.value, quantity: 1 }),
    });

    setAdding(false);
    if (res.ok) {
      setMessage("Added to your bag");
      router.refresh();
    } else {
      setMessage("Couldn't add that to your bag");
    }
  }

  async function toggleWishlist() {
    if (!requireAuth()) return;
    const next = !wishlisted;
    setWishlisted(next); // optimistic
    const res = await fetch(`/api/wishlist/${productId}`, { method: "POST" });
    if (!res.ok) setWishlisted(!next); // revert on failure
  }

  return (
    <div className="space-y-6">
      <p className="text-xl text-ink">{formatPrice(price, currency)}</p>

      {groups.map(([name, options]) => (
        <div key={name}>
          <p className="mb-2 text-xs text-stone">{name}</p>
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
              const isSelected = selected[name] === opt.value;
              const disabled = opt.stock <= 0;
              return (
                <button
                  key={opt.value}
                  disabled={disabled}
                  onClick={() => setSelected((prev) => ({ ...prev, [name]: opt.value }))}
                  className={`border px-3 py-1.5 text-sm transition-colors ${
                    isSelected ? "border-ink bg-ink text-paper" : "border-line text-ink"
                  } ${disabled ? "opacity-30 cursor-not-allowed line-through" : ""}`}
                >
                  {opt.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={addToBag}
          disabled={needsSelection || outOfStock || adding}
          className="flex-1 bg-ink py-3 text-sm text-paper disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {outOfStock
            ? "Out of stock"
            : needsSelection
              ? "Select options"
              : adding
                ? "Adding…"
                : "Add to bag"}
        </button>
        <button
          onClick={toggleWishlist}
          aria-label="Toggle wishlist"
          aria-pressed={wishlisted}
          className="border border-line p-3 text-ink"
        >
          <Heart size={18} strokeWidth={1.5} fill={wishlisted ? "currentColor" : "none"} />
        </button>
      </div>

      {message && <p className="text-sm text-stone">{message}</p>}
    </div>
  );
}
