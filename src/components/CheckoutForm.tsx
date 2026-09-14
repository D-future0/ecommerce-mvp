"use client";

import { useMemo, useState } from "react";
import { NIGERIAN_STATES, getShippingFee, getShippingLabel } from "@/lib/shipping";
import { formatPrice } from "@/lib/format";

export function CheckoutForm({ subtotal, currency }: { subtotal: number; currency: string }) {
  const [form, setForm] = useState({
    line1: "",
    line2: "",
    city: "",
    state: NIGERIAN_STATES[0],
    country: "Nigeria",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const shippingFee = useMemo(() => getShippingFee(form.state, form.country), [form.state, form.country]);
  const shippingLabel = useMemo(() => getShippingLabel(form.state, form.country), [form.state, form.country]);
  const total = subtotal + shippingFee;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Couldn't start checkout.");
      setLoading(false);
      return;
    }

    window.location.href = data.authorizationUrl;
  }

  const inputClass =
    "w-full border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-ink";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm text-stone">Shipping address</p>

      <input
        required
        placeholder="Address line 1"
        value={form.line1}
        onChange={(e) => update("line1", e.target.value)}
        className={inputClass}
      />
      <input
        placeholder="Address line 2 (optional)"
        value={form.line2}
        onChange={(e) => update("line2", e.target.value)}
        className={inputClass}
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          required
          placeholder="City"
          value={form.city}
          onChange={(e) => update("city", e.target.value)}
          className={inputClass}
        />
        <select
          required
          value={form.state}
          onChange={(e) => update("state", e.target.value)}
          className={inputClass}
        >
          {NIGERIAN_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input
          required
          placeholder="Country"
          value={form.country}
          onChange={(e) => update("country", e.target.value)}
          className={inputClass}
        />
        <input
          required
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="space-y-1 border-t border-line pt-4 text-sm">
        <div className="flex justify-between text-stone">
          <span>Shipping — {shippingLabel}</span>
          <span>{formatPrice(shippingFee, currency)}</span>
        </div>
        <div className="flex justify-between text-lg text-ink">
          <span>Total</span>
          <span>{formatPrice(total, currency)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-ink py-3 text-sm text-paper disabled:opacity-50"
      >
        {loading ? "Redirecting to payment…" : "Pay with Paystack"}
      </button>
    </form>
  );
}
