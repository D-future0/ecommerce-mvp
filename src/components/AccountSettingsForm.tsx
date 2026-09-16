"use client";

import { useState } from "react";

interface AccountUser {
  name: string;
  email: string;
  phone?: string;
  mobile?: string;
  addresses?: Array<{
    _id?: string;
    label?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
    isDefault?: boolean;
  }>;
  isDeactivated?: boolean;
}

const inputClass = "w-full border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-ink";

export function AccountSettingsForm({ initial }: { initial: AccountUser }) {
  const [profile, setProfile] = useState({
    name: initial.name ?? "",
    email: initial.email ?? "",
    phone: initial.phone ?? "",
    mobile: initial.mobile ?? "",
    password: "",
  });
  const [addressForm, setAddressForm] = useState({
    label: "Home",
    line1: "",
    line2: "",
    city: "",
    state: "",
    country: "Nigeria",
    phone: "",
    isDefault: true,
  });
  const [saving, setSaving] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/account/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setMessage({ type: "error", text: typeof data.error === "string" ? data.error : "Couldn't update your profile." });
      return;
    }

    setMessage({ type: "success", text: "Profile updated." });
    if (profile.password) setProfile((prev) => ({ ...prev, password: "" }));
    window.location.reload();
  }

  async function handleAddressSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingAddress(true);
    setMessage(null);

    const res = await fetch("/api/account/address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addressForm),
    });

    const data = await res.json().catch(() => ({}));
    setSavingAddress(false);

    if (!res.ok) {
      setMessage({ type: "error", text: typeof data.error === "string" ? data.error : "Couldn't save the address." });
      return;
    }

    setMessage({ type: "success", text: "Address saved." });
    setAddressForm({ label: "Home", line1: "", line2: "", city: "", state: "", country: "Nigeria", phone: "", isDefault: true });
    window.location.reload();
  }

  async function handleDeactivate() {
    if (!confirm("Deactivate your account? This will disable sign-in until an admin re-enables it.")) return;
    setDeactivating(true);
    setMessage(null);

    const res = await fetch("/api/account/deactivate", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setDeactivating(false);

    if (!res.ok) {
      setMessage({ type: "error", text: typeof data.error === "string" ? data.error : "Couldn't deactivate the account." });
      return;
    }

    setMessage({ type: "success", text: "Your account has been deactivated." });
    window.location.href = "/login";
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSave} className="space-y-5 rounded border border-line p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">Profile</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-stone">Full name</label>
            <input
              required
              value={profile.name}
              onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
              className={`mt-2 ${inputClass}`}
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-stone">Email</label>
            <input
              type="email"
              required
              value={profile.email}
              onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
              className={`mt-2 ${inputClass}`}
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-stone">Phone</label>
            <input
              value={profile.phone}
              onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
              className={`mt-2 ${inputClass}`}
              placeholder="+234 ..."
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-stone">Mobile number</label>
            <input
              value={profile.mobile}
              onChange={(e) => setProfile((prev) => ({ ...prev, mobile: e.target.value }))}
              className={`mt-2 ${inputClass}`}
              placeholder="+234 ..."
            />
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-[0.16em] text-stone">New password</label>
          <input
            type="password"
            value={profile.password}
            onChange={(e) => setProfile((prev) => ({ ...prev, password: e.target.value }))}
            className={`mt-2 ${inputClass}`}
            placeholder="Leave blank to keep current password"
          />
        </div>

        {message && (
          <p className={message.type === "success" ? "text-sm text-emerald-700" : "text-sm text-red-700"}>
            {message.text}
          </p>
        )}

        <button type="submit" disabled={saving} className="bg-ink px-4 py-2 text-sm text-paper disabled:opacity-50">
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>

      <form onSubmit={handleAddressSave} className="space-y-5 rounded border border-line p-5">
        <h2 className="text-xl font-medium">Address</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-[0.16em] text-stone">Phone</label>
            <input
              required
              value={addressForm.phone}
              onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
              className={`mt-2 ${inputClass}`}
            />
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-[0.16em] text-stone">Address line 1</label>
          <input
            required
            value={addressForm.line1}
            onChange={(e) => setAddressForm((prev) => ({ ...prev, line1: e.target.value }))}
            className={`mt-2 ${inputClass}`}
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-[0.16em] text-stone">Address line 2</label>
          <input
            value={addressForm.line2}
            onChange={(e) => setAddressForm((prev) => ({ ...prev, line2: e.target.value }))}
            className={`mt-2 ${inputClass}`}
            placeholder="Optional"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-stone">City</label>
            <input
              required
              value={addressForm.city}
              onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
              className={`mt-2 ${inputClass}`}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-stone">State</label>
            <input
              required
              value={addressForm.state}
              onChange={(e) => setAddressForm((prev) => ({ ...prev, state: e.target.value }))}
              className={`mt-2 ${inputClass}`}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-stone">Country</label>
            <input
              value={addressForm.country}
              onChange={(e) => setAddressForm((prev) => ({ ...prev, country: e.target.value }))}
              className={`mt-2 ${inputClass}`}
            />
          </div>
          <label className="flex items-center gap-2 pt-8 text-sm text-stone">
            <input
              type="checkbox"
              checked={addressForm.isDefault}
              onChange={(e) => setAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
            />
            Set as default address
          </label>
        </div>

        <button type="submit" disabled={savingAddress} className="bg-ink px-4 py-2 text-sm text-paper disabled:opacity-50">
          {savingAddress ? "Saving…" : "Add address"}
        </button>
      </form>

      <div className="rounded border border-red-200 bg-red-50 p-5">
        <h2 className="text-xl font-medium text-red-900">Deactivate account</h2>
        <p className="mt-2 text-sm text-red-700">
          Deactivating your account will prevent future sign-ins and lock access until it is re-enabled.
        </p>
        <button
          type="button"
          onClick={handleDeactivate}
          disabled={deactivating || initial.isDeactivated}
          className="mt-4 border border-red-300 bg-transparent px-4 py-2 text-sm text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deactivating ? "Deactivating…" : initial.isDeactivated ? "Account deactivated" : "Deactivate account"}
        </button>
      </div>
    </div>
  );
}
