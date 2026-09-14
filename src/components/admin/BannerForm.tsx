"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface BannerFormValues {
  _id?: string;
  title: string;
  subtitle?: string;
  image: string;
  href?: string;
  active: boolean;
  sortOrder: number;
}

export function BannerForm({ initial }: { initial?: BannerFormValues }) {
  const router = useRouter();
  const isEdit = !!initial?._id;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [href, setHref] = useState(initial?.href ?? "");
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [active, setActive] = useState(initial?.active ?? true);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onFileSelected(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Couldn't upload that image");
      setImage(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't upload that image");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        title,
        subtitle: subtitle || undefined,
        image,
        href: href || undefined,
        active,
        sortOrder: Number(sortOrder) || 0,
      };
      const res = await fetch(isEdit ? `/api/admin/banners/${initial!._id}` : "/api/admin/banners", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Couldn't save this banner.");
      router.push("/admin/banners");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save this banner.");
      setLoading(false);
    }
  }

  async function onDelete() {
    if (!initial?._id || !confirm(`Delete "${initial.title}"?`)) return;
    const res = await fetch(`/api/admin/banners/${initial._id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Couldn't delete this banner.");
      return;
    }
    router.push("/admin/banners");
    router.refresh();
  }

  const inputClass = "w-full border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-ink";

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-6">
      <div>
        <label className="text-xs text-stone">Title</label>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} className={`mt-1 ${inputClass}`} />
      </div>
      <div>
        <label className="text-xs text-stone">Supporting text</label>
        <textarea rows={2} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className={`mt-1 ${inputClass}`} />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs text-stone">Banner image</label>
          <label className="cursor-pointer text-xs text-ink underline underline-offset-2">
            {uploading ? "Uploading…" : "Upload image"}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={(e) => onFileSelected(e.target.files)} className="hidden" />
          </label>
        </div>
        {image && <img src={image} alt="" className="mt-2 h-32 w-full border border-line object-cover" />}
        <input required type="url" placeholder="https://..." value={image} onChange={(e) => setImage(e.target.value)} className={`mt-2 ${inputClass}`} />
      </div>
      <div>
        <label className="text-xs text-stone">Link (optional)</label>
        <input placeholder="/category/bags or https://..." value={href} onChange={(e) => setHref(e.target.value)} className={`mt-1 ${inputClass}`} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-stone">Display order</label>
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={`mt-1 ${inputClass}`} />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Active on homepage
        </label>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex items-center gap-4">
        <button type="submit" disabled={loading || uploading} className="bg-ink px-5 py-2.5 text-sm text-paper disabled:opacity-50">
          {loading ? "Saving…" : isEdit ? "Save changes" : "Create banner"}
        </button>
        {isEdit && <button type="button" onClick={onDelete} className="text-sm text-red-700 underline underline-offset-2">Delete banner</button>}
      </div>
    </form>
  );
}
