"use client";

import { useMemo, useState } from "react";

interface HomeCollectionItem {
  _id: string;
  name: string;
  showOnHome?: boolean;
  homeOrder?: number;
}

export function HomeCollectionsManager({
  categories,
}: {
  categories: HomeCollectionItem[];
}) {
  const [items, setItems] = useState(() =>
    [...categories]
      .sort((a, b) => (a.homeOrder ?? 100) - (b.homeOrder ?? 100))
      .map((category) => ({
        ...category,
        showOnHome: !!category.showOnHome,
        homeOrder: category.homeOrder ?? 100,
      }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const orderedVisibleItems = useMemo(
    () =>
      [...items]
        .filter((item) => item.showOnHome)
        .sort((a, b) => (a.homeOrder ?? 100) - (b.homeOrder ?? 100)),
    [items]
  );

  function updateItem(id: string, patch: Partial<HomeCollectionItem>) {
    setItems((prev) => prev.map((item) => (item._id === id ? { ...item, ...patch } : item)));
    setSaved(false);
  }

  async function handleSave() {
    const collectionIds = orderedVisibleItems.map((item) => item._id);

    setSaving(true);
    setError("");

    const res = await fetch("/api/admin/home-collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectionIds }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Couldn't update homepage collection order.");
      return;
    }

    setSaved(true);
  }

  return (
    <div className="mt-8 rounded border border-line bg-white/70 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm text-ink">Homepage collections</h2>
          <p className="mt-1 text-xs text-stone">Choose which top-level categories appear and in what order.</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-ink px-4 py-2 text-sm text-paper disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save order"}
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item._id} className="flex flex-col gap-3 rounded border border-line p-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-3 text-sm text-ink">
              <input
                type="checkbox"
                checked={item.showOnHome}
                onChange={(e) => updateItem(item._id, { showOnHome: e.target.checked })}
                className="accent-accent"
              />
              <span>{item.name}</span>
            </label>

            <div className="flex items-center gap-2 text-sm text-stone">
              <label htmlFor={`order-${item._id}`} className="text-xs uppercase tracking-[0.12em] text-stone">
                Order
              </label>
              <input
                id={`order-${item._id}`}
                type="number"
                min={1}
                value={item.homeOrder ?? 100}
                onChange={(e) => updateItem(item._id, { homeOrder: Number(e.target.value) || 100 })}
                className="w-20 border border-line bg-transparent px-2 py-1 text-sm outline-none focus:border-ink"
                disabled={!item.showOnHome}
              />
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {saved && <p className="mt-4 text-sm text-emerald-700">Homepage collection order saved.</p>}
    </div>
  );
}
