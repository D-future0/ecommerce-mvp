"use client";

import { useEffect } from "react";

export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`/api/products/${slug}/view`, { method: "POST" })
      .then(() => window.dispatchEvent(new Event("recently-viewed-updated")))
      .catch(() => {});
  }, [slug]);

  return null;
}
