"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Variant {
  name: string;
  value: string;
  priceDelta: number;
  stock: number;
  sku: string;
}

interface AttributeRow {
  key: string;
  value: string;
}

interface CategoryOption {
  _id: string;
  name: string;
}

interface CollectionOption {
  _id: string;
  title: string;
}

export interface ProductFormValues {
  _id?: string;
  title: string;
  slug: string;
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  price: number; // kobo
  compareAtPrice?: number;
  images: string[];
  category: string;
  collections: string[];
  tags: string[];
  attributes: Record<string, string>;
  variants: Variant[];
  stock: number;
  featured: boolean;
  isActive: boolean;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ProductForm({
  categories,
  collections = [],
  initial,
}: {
  categories: CategoryOption[];
  collections?: CollectionOption[];
  initial?: ProductFormValues;
}) {
  const router = useRouter();
  const isEdit = !!initial?._id;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription ?? "");
  const [priceNaira, setPriceNaira] = useState(initial ? String(initial.price / 100) : "");
  const [compareAtNaira, setCompareAtNaira] = useState(
    initial?.compareAtPrice ? String(initial.compareAtPrice / 100) : ""
  );
  const [images, setImages] = useState((initial?.images ?? []).join("\n"));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [category, setCategory] = useState(initial?.category ?? categories[0]?._id ?? "");
  const [selectedCollections, setSelectedCollections] = useState(initial?.collections ?? []);
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [attributes, setAttributes] = useState<AttributeRow[]>(
    initial ? Object.entries(initial.attributes).map(([key, value]) => ({ key, value })) : []
  );
  const [variants, setVariants] = useState<Variant[]>(initial?.variants ?? []);
  const [stock, setStock] = useState(initial ? String(initial.stock) : "0");
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function updateAttribute(index: number, field: "key" | "value", value: string) {
    setAttributes((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  async function onFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError("");

    const uploadedUrls: string[] = [];
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setUploadError(typeof data.error === "string" ? data.error : `Couldn't upload ${file.name}`);
        continue;
      }
      const data = await res.json();
      uploadedUrls.push(data.url);
    }

    if (uploadedUrls.length) {
      setImages((prev) => (prev ? `${prev}\n${uploadedUrls.join("\n")}` : uploadedUrls.join("\n")));
    }
    setUploading(false);
  }

  function updateVariant(index: number, field: keyof Variant, value: string) {
    setVariants((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]: field === "stock" || field === "priceDelta" ? Number(value) || 0 : value,
            }
          : row
      )
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      title,
      slug,
      description,
      seoTitle: seoTitle || undefined,
      seoDescription: seoDescription || undefined,
      price: Math.round(Number(priceNaira) * 100),
      compareAtPrice: compareAtNaira ? Math.round(Number(compareAtNaira) * 100) : undefined,
      currency: "NGN",
      images: images.split("\n").map((s) => s.trim()).filter(Boolean),
      category,
      collections: selectedCollections,
      tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
      attributes: Object.fromEntries(
        attributes.filter((a) => a.key.trim()).map((a) => [a.key.trim(), a.value.trim()])
      ),
      variants,
      stock: Number(stock) || 0,
      featured,
      isActive,
    };

    const res = await fetch(isEdit ? `/api/admin/products/${initial!._id}` : "/api/admin/products", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Couldn't save this product.");
      setLoading(false);
      return;
    }

    router.push("/admin/products");
    router.refresh();
  }

  async function onDelete() {
    if (!initial?._id) return;
    if (!confirm(`Delete "${initial.title}"? This can't be undone.`)) return;
    await fetch(`/api/admin/products/${initial._id}`, { method: "DELETE" });
    router.push("/admin/products");
    router.refresh();
  }

  const inputClass =
    "w-full border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-ink";

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-xs text-stone">Title</label>
          <input required value={title} onChange={(e) => onTitleChange(e.target.value)} className={`mt-1 ${inputClass}`} />
        </div>

        <div className="col-span-2 border-t border-line pt-5">
          <p className="text-xs text-stone">Search engine listing</p>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div><label className="text-xs text-stone">SEO title</label><input maxLength={70} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className={`mt-1 ${inputClass}`} /></div>
            <div><label className="text-xs text-stone">SEO description</label><textarea maxLength={160} rows={2} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} className={`mt-1 ${inputClass}`} /></div>
          </div>
        </div>
        <div className="col-span-2">
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
        <div className="col-span-2">
          <label className="text-xs text-stone">Description</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </div>

        <div>
          <label className="text-xs text-stone">Price (₦)</label>
          <input
            required
            type="number"
            min={0}
            step="0.01"
            value={priceNaira}
            onChange={(e) => setPriceNaira(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        {collections.length > 0 && (
          <div className="col-span-2">
            <label className="text-xs text-stone">Collections (optional)</label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {collections.map((collection) => (
                <label key={collection._id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={selectedCollections.includes(collection._id)} onChange={(e) => setSelectedCollections((current) => e.target.checked ? [...current, collection._id] : current.filter((id) => id !== collection._id))} />
                  {collection.title}
                </label>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className="text-xs text-stone">Compare-at price (₦, optional)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={compareAtNaira}
            onChange={(e) => setCompareAtNaira(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </div>

        <div>
          <label className="text-xs text-stone">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={`mt-1 ${inputClass}`}>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-stone">Base stock (no variants)</label>
          <input
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </div>

        <div className="col-span-2">
          <label className="text-xs text-stone">Tags (comma separated)</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} className={`mt-1 ${inputClass}`} />
        </div>

        <div className="col-span-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-stone">Images</label>
            <label className="cursor-pointer text-xs text-ink underline underline-offset-2">
              {uploading ? "Uploading…" : "Upload images"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                disabled={uploading}
                onChange={(e) => onFilesSelected(e.target.files)}
                className="hidden"
              />
            </label>
          </div>

          {uploadError && <p className="mt-1 text-xs text-red-700">{uploadError}</p>}

          {images.trim() && (
            <div className="mt-2 flex flex-wrap gap-2">
              {images
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url + i} src={url} alt="" className="h-16 w-16 border border-line object-cover" />
                ))}
            </div>
          )}

          <textarea
            rows={3}
            value={images}
            onChange={(e) => setImages(e.target.value)}
            placeholder="Uploaded image URLs appear here — you can also paste URLs directly"
            className={`mt-2 ${inputClass}`}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs text-stone">Filterable attributes (e.g. color: Black)</label>
          <button
            type="button"
            onClick={() => setAttributes((prev) => [...prev, { key: "", value: "" }])}
            className="text-xs text-ink underline underline-offset-2"
          >
            + Add attribute
          </button>
        </div>
        <div className="mt-2 space-y-2">
          {attributes.map((row, i) => (
            <div key={i} className="flex gap-2">
              <input
                placeholder="key (e.g. color)"
                value={row.key}
                onChange={(e) => updateAttribute(i, "key", e.target.value)}
                className={inputClass}
              />
              <input
                placeholder="value (e.g. Black)"
                value={row.value}
                onChange={(e) => updateAttribute(i, "value", e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setAttributes((prev) => prev.filter((_, idx) => idx !== i))}
                className="px-2 text-xs text-stone"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs text-stone">Variants (leave empty for a single-SKU product)</label>
          <button
            type="button"
            onClick={() =>
              setVariants((prev) => [...prev, { name: "Size", value: "", priceDelta: 0, stock: 0, sku: "" }])
            }
            className="text-xs text-ink underline underline-offset-2"
          >
            + Add variant
          </button>
        </div>
        <div className="mt-2 space-y-2">
          {variants.map((v, i) => (
            <div key={i} className="grid grid-cols-5 gap-2">
              <input
                placeholder="Name (Size)"
                value={v.name}
                onChange={(e) => updateVariant(i, "name", e.target.value)}
                className={inputClass}
              />
              <input
                placeholder="Value (M)"
                value={v.value}
                onChange={(e) => updateVariant(i, "value", e.target.value)}
                className={inputClass}
              />
              <input
                placeholder="Price delta (₦)"
                type="number"
                value={v.priceDelta}
                onChange={(e) => updateVariant(i, "priceDelta", e.target.value)}
                className={inputClass}
              />
              <input
                placeholder="Stock"
                type="number"
                value={v.stock}
                onChange={(e) => updateVariant(i, "stock", e.target.value)}
                className={inputClass}
              />
              <div className="flex gap-1">
                <input
                  placeholder="SKU"
                  value={v.sku}
                  onChange={(e) => updateVariant(i, "sku", e.target.value)}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setVariants((prev) => prev.filter((_, idx) => idx !== i))}
                  className="px-2 text-xs text-stone"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="accent-accent" />
          Featured
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="accent-accent" />
          Active (visible in store)
        </label>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="flex items-center gap-4">
        <button type="submit" disabled={loading} className="bg-ink px-5 py-2.5 text-sm text-paper disabled:opacity-50">
          {loading ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </button>
        {isEdit && (
          <button type="button" onClick={onDelete} className="text-sm text-red-700 underline underline-offset-2">
            Delete product
          </button>
        )}
      </div>
    </form>
  );
}
