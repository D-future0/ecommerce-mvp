"use client";

import { useState } from "react";
import Image from "next/image";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const shown = images.length ? images : [];

  return (
    <div>
      <div className="relative aspect-[4/5] w-full bg-sand">
        {shown[active] ? (
          <Image
            src={shown[active]}
            alt={title}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-stone text-sm">
            No image
          </div>
        )}
      </div>

      {shown.length > 1 && (
        <div className="mt-3 flex gap-2">
          {shown.map((img, i) => (
            <button
              key={img + i}
              onClick={() => setActive(i)}
              className={`relative h-16 w-16 shrink-0 bg-sand ${
                i === active ? "ring-1 ring-ink" : "opacity-70"
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <Image src={img} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
