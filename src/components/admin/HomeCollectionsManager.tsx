"use client";

import { useMemo, useState } from "react";

interface HomeCollectionItem {
  _id: string;
  name: string;
  showOnHome?: boolean;
  homeOrder?: number;
  homeTheme?: "purple" | "rose" | "slate" | "emerald" | "gold";
  homeDisplayMode?: "grid" | "carousel";
}

export function HomeCollectionsManager({
  collections = [],
}: {
  collections?: HomeCollectionItem[];
}) {
  const [items, setItems] = useState(() =>
    [...collections]
      .sort((a, b) => (a.homeOrder ?? 100) - (b.homeOrder ?? 100))
      .map((category) => ({
        ...category,
        showOnHome: !!category.showOnHome,
        homeOrder: category.homeOrder ?? 100,
        homeTheme: category.homeTheme ?? "purple",
        homeDisplayMode: category.homeDisplayMode ?? "grid",
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
    const collectionIds = orderedVisibleItems.map((item) => ({
      id: item._id,
      homeOrder: item.homeOrder ?? 100,
      homeTheme: item.homeTheme ?? "purple",
      homeDisplayMode: item.homeDisplayMode ?? "grid",
    }));

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
          <p className="mt-1 text-xs text-stone">Choose which collections appear, their order, style, and theme.</p>
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
              <div className="flex items-center gap-3 text-sm text-ink">
              <input
                type="checkbox"
                checked={item.showOnHome}
                onChange={(e) => updateItem(item._id, { showOnHome: e.target.checked })}
                className="accent-accent"
              />
                <span>{item.name}</span>
              </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-stone">
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
              <label htmlFor={`style-${item._id}`} className="sr-only">Style for {item.name}</label>
              <select
                id={`style-${item._id}`}
                value={item.homeDisplayMode}
                onChange={(e) => updateItem(item._id, { homeDisplayMode: e.target.value as HomeCollectionItem["homeDisplayMode"] })}
                disabled={!item.showOnHome}
                className="border border-line bg-transparent px-2 py-1 text-sm text-ink outline-none focus:border-ink"
              >
                <option value="grid">Grid</option>
                <option value="carousel">Carousel</option>
              </select>
              <label htmlFor={`theme-${item._id}`} className="sr-only">Theme for {item.name}</label>
              <select
                id={`theme-${item._id}`}
                value={item.homeTheme}
                onChange={(e) => updateItem(item._id, { homeTheme: e.target.value as HomeCollectionItem["homeTheme"] })}
                disabled={!item.showOnHome}
                className="border border-line bg-transparent px-2 py-1 text-sm text-ink outline-none focus:border-ink"
              >
                <option value="purple">Purple</option>
                <option value="rose">Rose</option>
                <option value="slate">Slate</option>
                <option value="emerald">Emerald</option>
                <option value="gold">Gold</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {saved && <p className="mt-4 text-sm text-emerald-700">Homepage collection order saved.</p>}
    </div>
  );
}
