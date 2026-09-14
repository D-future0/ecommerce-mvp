"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReviewForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError("");

    const res = await fetch(`/api/products/${slug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, title: title || undefined, body }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Couldn't submit your review.");
      setStatus("error");
      return;
    }

    setTitle("");
    setBody("");
    setStatus("idle");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 border-t border-line pt-6">
      <p className="text-sm text-ink">Write a review</p>

      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className={`text-lg ${n <= rating ? "text-ink" : "text-line"}`}
          >
            ★
          </button>
        ))}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="w-full border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
      />

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share your thoughts on this product"
        required
        minLength={10}
        rows={4}
        className="w-full border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
      />

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="bg-ink px-5 py-2.5 text-sm text-paper disabled:opacity-50"
      >
        {status === "submitting" ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
