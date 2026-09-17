"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface CollectionFormValues {
  _id?: string;
  title: string;
  slug: string;
  description?: string;
  image?: string;
  seoTitle?: string;
  seoDescription?: string;
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function CollectionForm({ initial }: { initial?: CollectionFormValues }) {
  const router = useRouter();
  const isEdit = !!initial?._id;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputClass = "w-full border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-ink";

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(isEdit ? `/api/admin/collections/${initial!._id}` : "/api/admin/collections", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug, description: description || undefined, image: image || undefined, seoTitle: seoTitle || undefined, seoDescription: seoDescription || undefined }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Couldn't save this collection.");
      setLoading(false);
      return;
    }
    router.push("/admin/collections");
    router.refresh();
  }

  async function onDelete() {
    if (!initial?._id || !confirm(`Delete "${initial.title}"? Products will remain but lose this collection.`)) return;
    await fetch(`/api/admin/collections/${initial._id}`, { method: "DELETE" });
    router.push("/admin/collections");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-6">
      <div><label className="text-xs text-stone">Title</label><input required value={title} onChange={(e) => { setTitle(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} className={`mt-1 ${inputClass}`} /></div>
      <div><label className="text-xs text-stone">Slug</label><input required value={slug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }} className={`mt-1 ${inputClass}`} /></div>
      <div><label className="text-xs text-stone">Description</label><textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={`mt-1 ${inputClass}`} /></div>
      <div><label className="text-xs text-stone">Image URL (optional)</label><input type="url" value={image} onChange={(e) => setImage(e.target.value)} className={`mt-1 ${inputClass}`} /></div>
      <div className="border-t border-line pt-5"><p className="text-xs text-stone">Search engine listing</p><div className="mt-3 space-y-4"><div><label className="text-xs text-stone">SEO title</label><input maxLength={70} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className={`mt-1 ${inputClass}`} /></div><div><label className="text-xs text-stone">SEO description</label><textarea maxLength={160} rows={3} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} className={`mt-1 ${inputClass}`} /></div></div></div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex items-center gap-4"><button type="submit" disabled={loading} className="bg-ink px-5 py-2.5 text-sm text-paper disabled:opacity-50">{loading ? "Saving…" : isEdit ? "Save changes" : "Create collection"}</button>{isEdit && <button type="button" onClick={onDelete} className="text-sm text-red-700 underline underline-offset-2">Delete collection</button>}</div>
    </form>
  );
}
