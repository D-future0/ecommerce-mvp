"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface FilterRow {
  key: string;
  label: string;
  options: string; // comma separated in the UI, split on submit
}

export interface CategoryFormValues {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string | null;
  filters: { key: string; label: string; options: string[] }[];
  showOnHome?: boolean;
  homeOrder?: number;
  homeTheme?: "purple" | "rose" | "slate" | "emerald" | "gold";
  homeDisplayMode?: "grid" | "carousel";
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function CategoryForm({ initial, categories = [] }: { initial?: CategoryFormValues; categories?: { _id: string; name: string }[] }) {
  const router = useRouter();
  const isEdit = !!initial?._id;

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [parent, setParent] = useState(initial?.parent ?? "");
  const [showOnHome, setShowOnHome] = useState(initial?.showOnHome ?? false);
  const [homeOrder, setHomeOrder] = useState(initial?.homeOrder ?? 100);
  const [homeTheme, setHomeTheme] = useState(initial?.homeTheme ?? "purple");
  const [homeDisplayMode, setHomeDisplayMode] = useState(initial?.homeDisplayMode ?? "grid");
  const [uploading, setUploading] = useState(false);
  const [filters, setFilters] = useState<FilterRow[]>(
    initial?.filters.map((f) => ({ key: f.key, label: f.label, options: f.options.join(", ") })) ?? []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function onFileSelected(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      setImage(data.url);
    } else {
      setError("Couldn't upload that image");
    }
    setUploading(false);
  }

  function updateFilter(index: number, field: keyof FilterRow, value: string) {
    setFilters((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      name,
      slug,
      description: description || undefined,
      image: image || undefined,
      parent: parent || null,
      showOnHome,
      homeOrder,
      homeTheme,
      homeDisplayMode,
      filters: filters
        .filter((f) => f.key.trim() && f.label.trim())
        .map((f) => ({
          key: f.key.trim(),
          label: f.label.trim(),
          options: f.options.split(",").map((o) => o.trim()).filter(Boolean),
        })),
    };

    const res = await fetch(isEdit ? `/api/admin/categories/${initial!._id}` : "/api/admin/categories", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Couldn't save this category.");
      setLoading(false);
      return;
    }

    router.push("/admin/categories");
    router.refresh();
  }

  async function onDelete() {
    if (!initial?._id) return;
    if (!confirm(`Delete "${initial.name}"?`)) return;

    const res = await fetch(`/api/admin/categories/${initial._id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Couldn't delete this category.");
      return;
    }
    router.push("/admin/categories");
    router.refresh();
  }

  const inputClass =
    "w-full border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-ink";

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-6">
      <div>
        <label className="text-xs text-stone">Name</label>
        <input required value={name} onChange={(e) => onNameChange(e.target.value)} className={`mt-1 ${inputClass}`} />
      </div>
      <div>
        <label className="text-xs text-stone">Slug</label>
        <input
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          className={`mt-1 ${inputClass}`}
        />
      </div>
      <div>
        <label className="text-xs text-stone">Parent category (optional)</label>
        <select value={parent} onChange={(e) => setParent(e.target.value)} className={`mt-1 ${inputClass}`}>
          <option value="">Top-level category</option>
          {categories.filter((category) => category._id !== initial?._id).map((category) => (
            <option key={category._id} value={category._id}>{category.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs text-stone">Description</label>
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={`mt-1 ${inputClass}`} />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs text-stone">Image</label>
          <label className="cursor-pointer text-xs text-ink underline underline-offset-2">
            {uploading ? "Uploading…" : "Upload image"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={uploading}
              onChange={(e) => onFileSelected(e.target.files)}
              className="hidden"
            />
          </label>
        </div>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="mt-2 h-16 w-16 border border-line object-cover" />
        )}
        <input value={image} onChange={(e) => setImage(e.target.value)} className={`mt-2 ${inputClass}`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs text-stone">Show on home page</label>
          <div className="mt-2 flex items-center gap-2">
            <input type="checkbox" checked={showOnHome} onChange={(e) => setShowOnHome(e.target.checked)} className="accent-accent" />
            <span className="text-sm text-stone">Display this collection on the landing page</span>
          </div>
        </div>
        <div>
          <label className="text-xs text-stone">Homepage order</label>
          <input
            type="number"
            min={1}
            value={homeOrder}
            onChange={(e) => setHomeOrder(Number(e.target.value) || 100)}
            className={`mt-2 ${inputClass}`}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs text-stone">Theme color</label>
          <select value={homeTheme} onChange={(e) => setHomeTheme(e.target.value as any)} className={`mt-2 ${inputClass}`}>
            <option value="purple">Purple</option>
            <option value="rose">Rose</option>
            <option value="slate">Slate</option>
            <option value="emerald">Emerald</option>
            <option value="gold">Gold</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-stone">Display mode</label>
          <select value={homeDisplayMode} onChange={(e) => setHomeDisplayMode(e.target.value as any)} className={`mt-2 ${inputClass}`}>
            <option value="grid">Grid</option>
            <option value="carousel">Carousel</option>
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs text-stone">Filters shown on this category's page</label>
          <button
            type="button"
            onClick={() => setFilters((prev) => [...prev, { key: "", label: "", options: "" }])}
            className="text-xs text-ink underline underline-offset-2"
          >
            + Add filter
          </button>
        </div>
        <div className="mt-2 space-y-2">
          {filters.map((f, i) => (
            <div key={i} className="grid grid-cols-4 gap-2">
              <input
                placeholder="key (color)"
                value={f.key}
                onChange={(e) => updateFilter(i, "key", e.target.value)}
                className={inputClass}
              />
              <input
                placeholder="Label (Color)"
                value={f.label}
                onChange={(e) => updateFilter(i, "label", e.target.value)}
                className={inputClass}
              />
              <input
                placeholder="Options: Black, Tan"
                value={f.options}
                onChange={(e) => updateFilter(i, "options", e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setFilters((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-xs text-stone"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="flex items-center gap-4">
        <button type="submit" disabled={loading} className="bg-ink px-5 py-2.5 text-sm text-paper disabled:opacity-50">
          {loading ? "Saving…" : isEdit ? "Save changes" : "Create category"}
        </button>
        {isEdit && (
          <button type="button" onClick={onDelete} className="text-sm text-red-700 underline underline-offset-2">
            Delete category
          </button>
        )}
      </div>
    </form>
  );
}
