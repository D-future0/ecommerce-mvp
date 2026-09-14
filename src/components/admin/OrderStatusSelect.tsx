"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [saving, setSaving] = useState(false);

  async function onChange(value: string) {
    setCurrent(value);
    setSaving(true);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: value }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <select
      value={current}
      onChange={(e) => onChange(e.target.value)}
      disabled={saving}
      className="border border-line bg-transparent px-2 py-1.5 text-sm outline-none focus:border-ink"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
