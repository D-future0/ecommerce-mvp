"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPrice } from "@/lib/format";

export interface CartItem {
  productId: string;
  slug: string;
  title: string;
  image: string | null;
  price: number;
  currency: string;
  variant?: string;
  quantity: number;
  stock: number;
}

export function CartItemRow({ item }: { item: CartItem }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function updateQuantity(quantity: number) {
    if (quantity < 1) return;
    setPending(true);
    await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: item.productId, variant: item.variant, quantity }),
    });
    setPending(false);
    router.refresh();
  }

  async function remove() {
    setPending(true);
    await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: item.productId, variant: item.variant }),
    });
    setPending(false);
    router.refresh();
  }

  return (
    <div className={`flex gap-4 border-b border-line py-6 ${pending ? "opacity-60" : ""}`}>
      <Link href={`/product/${item.slug}`} className="relative h-24 w-20 shrink-0 bg-sand">
        {item.image && (
          <Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <Link href={`/product/${item.slug}`} className="text-sm text-ink">
            {item.title}
          </Link>
          {item.variant && <p className="mt-1 text-xs text-stone">{item.variant}</p>}
          <p className="mt-1 text-sm text-ink">{formatPrice(item.price, item.currency)}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center border border-line">
            <button
              onClick={() => updateQuantity(item.quantity - 1)}
              disabled={pending || item.quantity <= 1}
              className="px-2.5 py-1 text-sm disabled:opacity-30"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="px-3 text-sm">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.quantity + 1)}
              disabled={pending || item.quantity >= item.stock}
              className="px-2.5 py-1 text-sm disabled:opacity-30"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button onClick={remove} disabled={pending} className="text-xs text-stone underline underline-offset-2">
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
