"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/format";

interface OrderStatus {
  status: string;
  total: number;
  currency: string;
  paystackReference: string;
}

function ReturnContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!reference) return;

    let cancelled = false;

    async function poll() {
      const res = await fetch(`/api/checkout/${reference}`);
      if (cancelled) return;

      if (!res.ok) {
        setError("Couldn't find that order.");
        return;
      }

      const data = await res.json();
      setOrder(data.order);

      // Give the webhook a moment if it's still pending, then re-check once.
      if (data.order?.status === "pending") {
        setTimeout(() => !cancelled && poll(), 3000);
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  if (!reference) {
    return <p className="text-stone">Missing order reference.</p>;
  }

  if (error) {
    return <p className="text-red-700">{error}</p>;
  }

  if (!order) {
    return <p className="text-stone">Confirming your payment…</p>;
  }

  if (order.status === "paid" || order.status === "processing") {
    return (
      <div>
        <h1 className="font-serif text-3xl">Order confirmed</h1>
        <p className="mt-3 text-stone">
          Thanks — your payment of {formatPrice(order.total, order.currency)} went through.
        </p>
        <p className="mt-1 text-xs text-stone">Reference: {order.paystackReference}</p>
        <Link href="/" className="mt-6 inline-block text-sm text-ink underline underline-offset-2">
          Continue shopping
        </Link>
      </div>
    );
  }

  if (order.status === "cancelled") {
    return (
      <div>
        <h1 className="font-serif text-3xl">Payment not completed</h1>
        <p className="mt-3 text-stone">The transaction wasn't successful. No charge was made.</p>
        <Link href="/cart" className="mt-6 inline-block text-sm text-ink underline underline-offset-2">
          Back to your bag
        </Link>
      </div>
    );
  }

  return <p className="text-stone">Confirming your payment…</p>;
}

export default function CheckoutReturnPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-20 sm:px-6 lg:px-8">
      <Suspense fallback={<p className="text-stone">Confirming your payment…</p>}>
        <ReturnContent />
      </Suspense>
    </main>
  );
}
