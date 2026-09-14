"use client";

import { useEffect } from "react";

export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`/api/products/${slug}/view`, { method: "POST" }).catch(() => {});
  }, [slug]);

  return null;
}
