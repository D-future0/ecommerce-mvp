import { connectToDatabase } from "@/lib/db";
import { Cart } from "@/models/Cart";
import { Product } from "@/models/Product";
import type { IProductVariant } from "@/models/Product";

export interface CartItemView {
  productId: string;
  slug: string;
  title: string;
  image: string | null;
  price: number;
  currency: string;
  variant?: string;
  quantity: number;
  stock: number;
}

function parseVariants(value: unknown): IProductVariant[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (variant): variant is IProductVariant =>
      typeof variant === "object" &&
      variant !== null &&
      typeof variant.name === "string" &&
      typeof variant.value === "string" &&
      typeof variant.stock === "number" &&
      typeof variant.sku === "string"
  );
}

export async function getCartItems(userId: string): Promise<CartItemView[]> {
  await connectToDatabase();
  const cart = await Cart.findUnique({
    where: { user: userId },
    include: { items: { orderBy: { position: "asc" } } },
  });
  if (!cart?.items.length) return [];

  const products = await Product.findMany({ where: { id: { in: cart.items.map((item) => item.product) } } });
  const productMap = new Map(products.map((product) => [product.id, product]));

  return cart.items
    .map((item): CartItemView | null => {
      const product = productMap.get(item.product);
      if (!product) return null;
      const variant = parseVariants(product.variants).find((entry) => entry.value === item.variant);
      return {
        productId: product.id,
        slug: product.slug,
        title: product.title,
        image: product.images[0] ?? null,
        price: product.price + (variant?.priceDelta ?? 0),
        currency: product.currency,
        variant: item.variant || undefined,
        quantity: item.quantity,
        stock: variant?.stock ?? product.stock,
      };
    })
    .filter((item): item is CartItemView => item !== null);
}
