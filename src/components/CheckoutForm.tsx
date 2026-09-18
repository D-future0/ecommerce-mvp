"use client";

import { useState } from "react";
import { LAGOS_LGAS, NIGERIAN_STATES, STORE_PICKUP_ADDRESS, getDeliveryFee } from "@/lib/shipping";
import { formatPrice } from "@/lib/format";

interface BillingAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
}

type DeliveryMethod = "store_pickup" | "delivery";

interface CheckoutFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  state: string;
  lga: string;
  city: string;
  line1: string;
  line2: string;
  deliveryMethod: DeliveryMethod;
  saveBillingAddress: boolean;
}

function splitName(name: string) {
  const [firstName = "", ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(" ") };
}

export function CheckoutForm({
  subtotal,
  itemCount,
  currency,
  customerName,
  customerEmail,
  billingAddress,
}: {
  subtotal: number;
  itemCount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  billingAddress: BillingAddress | null;
}) {
  const name = splitName(customerName);
  const hasBillingAddress = Boolean(billingAddress?.line1);
  const [form, setForm] = useState<CheckoutFormState>({
    ...name,
    email: customerEmail,
    phone: billingAddress?.phone ?? "",
    country: billingAddress?.country ?? "Nigeria",
    state: billingAddress?.state ?? "",
    lga: "",
    city: billingAddress?.city ?? "",
    line1: billingAddress?.line1 ?? "",
    line2: billingAddress?.line2 ?? "",
    deliveryMethod: "delivery",
    saveBillingAddress: !hasBillingAddress,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof CheckoutFormState>(key: K, value: CheckoutFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const isPickup = form.deliveryMethod === "store_pickup";
  const shippingFee = isPickup ? 0 : getDeliveryFee(form.state, form.lga) * itemCount;
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
      <fieldset className="space-y-3">
        <legend className="text-sm text-stone">Delivery method</legend>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="radio"
            name="deliveryMethod"
            checked={isPickup}
            onChange={() => setForm((prev) => ({ ...prev, deliveryMethod: "store_pickup", lga: "" }))}
          />
          Pick up from store
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="radio"
            name="deliveryMethod"
            checked={!isPickup}
            onChange={() => setForm((prev) => ({ ...prev, deliveryMethod: "delivery" }))}
          />
          Deliver my order
        </label>
      </fieldset>

      {isPickup ? (
        <div className="space-y-2 border border-line p-4 text-sm">
          <p className="text-stone">Pickup location</p>
          <p>{STORE_PICKUP_ADDRESS}</p>
          <p className="text-stone">We will contact you when your order is ready for collection.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-stone">Delivery address</p>

          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="First name" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className={inputClass} />
            <input required placeholder="Last name" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input required type="email" placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass} />
            <input required placeholder="Phone number" value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputClass} />
          </div>
          <input required value={form.country} onChange={(e) => update("country", e.target.value)} className={inputClass} aria-label="Country" />

          <div className="grid grid-cols-2 gap-3">
            <select required value={form.state} onChange={(e) => update("state", e.target.value)} className={inputClass}>
              <option value="">Select state</option>
              {NIGERIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
            </select>
            {form.state === "Lagos" ? (
              <select required value={form.lga} onChange={(e) => update("lga", e.target.value)} className={inputClass}>
                <option value="">Select Lagos LGA</option>
                {Object.keys(LAGOS_LGAS).map((lga) => <option key={lga} value={lga}>{lga}</option>)}
              </select>
            ) : (
              <input required placeholder="City / Town" value={form.city} onChange={(e) => update("city", e.target.value)} className={inputClass} />
            )}
          </div>
          {form.state === "Lagos" && <input required placeholder="City / Town" value={form.city} onChange={(e) => update("city", e.target.value)} className={inputClass} />}
          <input required placeholder="Street address" value={form.line1} onChange={(e) => update("line1", e.target.value)} className={inputClass} />
          <input placeholder="Additional address information (optional)" value={form.line2} onChange={(e) => update("line2", e.target.value)} className={inputClass} />

          {!hasBillingAddress && (
            <label className="flex items-center gap-2 text-sm text-stone">
              <input type="checkbox" checked={form.saveBillingAddress} onChange={(e) => update("saveBillingAddress", e.target.checked)} />
              Save this as my billing address
            </label>
          )}

          <div className="border border-line p-3 text-sm text-stone">
            <p>Delivery type: {form.state === "Lagos" ? "Door-to-door" : "Terminal/Pickup"}</p>
            {form.state !== "Lagos" && form.state && <p className="mt-2">Interstate orders are delivered to a designated courier/transport terminal in your destination state. Doorstep delivery is not included. You will be contacted with the pickup location.</p>}
          </div>
        </>
      )}

      <div className="space-y-1 border-t border-line pt-4 text-sm">
        <div className="flex justify-between text-stone">
          <span>Delivery fee ({itemCount} {itemCount === 1 ? "item" : "items"})</span>
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
