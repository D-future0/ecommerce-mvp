"use client";

import { useState } from "react";

interface BillingAddress {
  label?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
}

const inputClass = "w-full border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-ink";

export function BillingAddressForm({ initial }: { initial?: BillingAddress | null }) {
  const [form, setForm] = useState({
    label: initial?.label ?? "Billing",
    line1: initial?.line1 ?? "",
    line2: initial?.line2 ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    country: initial?.country ?? "Nigeria",
    phone: initial?.phone ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/account/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setMessage({ type: "error", text: typeof data.error === "string" ? data.error : "Couldn't save your billing address." });
      return;
    }

    setMessage({ type: "success", text: "Billing address saved." });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded border border-line p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs uppercase tracking-[0.16em] text-stone">Label</label>
          <input
            value={form.label}
            onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
            className={`mt-2 ${inputClass}`}
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.16em] text-stone">Phone</label>
          <input
            required
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            className={`mt-2 ${inputClass}`}
          />
        </div>
      </div>

      <div>
        <label className="text-xs uppercase tracking-[0.16em] text-stone">Address line 1</label>
        <input
          required
          value={form.line1}
          onChange={(e) => setForm((prev) => ({ ...prev, line1: e.target.value }))}
          className={`mt-2 ${inputClass}`}
        />
      </div>

      <div>
        <label className="text-xs uppercase tracking-[0.16em] text-stone">Address line 2</label>
        <input
          value={form.line2}
          onChange={(e) => setForm((prev) => ({ ...prev, line2: e.target.value }))}
          className={`mt-2 ${inputClass}`}
          placeholder="Optional"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs uppercase tracking-[0.16em] text-stone">City</label>
          <input
            required
            value={form.city}
            onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
            className={`mt-2 ${inputClass}`}
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.16em] text-stone">State</label>
          <input
            required
            value={form.state}
            onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
            className={`mt-2 ${inputClass}`}
          />
        </div>
      </div>

      <div>
        <label className="text-xs uppercase tracking-[0.16em] text-stone">Country</label>
        <input
          required
          value={form.country}
          onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
          className={`mt-2 ${inputClass}`}
        />
      </div>

      {message && (
        <p className={message.type === "success" ? "text-sm text-emerald-700" : "text-sm text-red-700"}>
          {message.text}
        </p>
      )}

      <button type="submit" disabled={saving} className="bg-ink px-4 py-2 text-sm text-paper disabled:opacity-50">
        {saving ? "Saving…" : "Save billing address"}
      </button>
    </form>
  );
}
