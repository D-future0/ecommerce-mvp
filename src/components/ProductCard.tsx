import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/format";
import type { ProductListItem } from "@/types/product";

export function ProductCard({ product }: { product: ProductListItem }) {
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-sand">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-stone text-sm">
            No image
          </div>
        )}
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <h3 className="text-sm text-ink leading-snug">{product.title}</h3>
      </div>

      <div className="mt-1 flex items-center gap-2 text-sm">
        <span className={onSale ? "text-accent" : "text-ink"}>
          {formatPrice(product.price, product.currency)}
        </span>
        {onSale && (
          <span className="text-stone line-through">
            {formatPrice(product.compareAtPrice as number, product.currency)}
          </span>
        )}
      </div>

      {product.ratingCount > 0 && (
        <p className="mt-1 text-xs text-stone">
          {product.ratingAverage.toFixed(1)} · {product.ratingCount}{" "}
          {product.ratingCount === 1 ? "review" : "reviews"}
        </p>
      )}
    </Link>
  );
}
