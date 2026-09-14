"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export interface BannerItem {
  _id: string;
  title: string;
  subtitle?: string;
  image: string;
  href?: string;
}

export function BannerCarousel({ banners }: { banners: BannerItem[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % banners.length), 6000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  if (!banners.length) return null;
  const banner = banners[index];
  const content = (
    <div className="relative min-h-[18rem] overflow-hidden bg-ink text-paper sm:min-h-[24rem]">
      <img src={banner.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
      <div className="absolute inset-0 bg-black/35" />
      <div className="relative flex min-h-[18rem] max-w-xl flex-col justify-end p-6 sm:min-h-[24rem] sm:p-10">
        <h2 className="font-serif text-3xl leading-tight sm:text-5xl">{banner.title}</h2>
        {banner.subtitle && <p className="mt-3 max-w-md text-sm text-paper/85 sm:text-base">{banner.subtitle}</p>}
      </div>
      {banners.length > 1 && (
        <div className="absolute bottom-6 right-6 flex gap-2" aria-label="Banner slides">
          {banners.map((item, itemIndex) => (
            <button
              key={item._id}
              type="button"
              aria-label={`Show banner ${itemIndex + 1}`}
              aria-current={itemIndex === index}
              onClick={(event) => { event.preventDefault(); setIndex(itemIndex); }}
              className={`h-1.5 w-8 ${itemIndex === index ? "bg-paper" : "bg-paper/45"}`}
            />
          ))}
        </div>
      )}
    </div>
  );

  return banner.href ? <Link href={banner.href}>{content}</Link> : content;
}
