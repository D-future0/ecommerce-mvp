import { connectToDatabase } from "@/lib/db";
import { Cart } from "@/models/Cart";
import { Product } from "@/models/Product";

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

export async function getCartItems(userId: string): Promise<CartItemView[]> {
  await connectToDatabase();
  const cart = await Cart.findOne({ user: userId }).lean();
  if (!cart || !cart.items.length) return [];

  const productIds = cart.items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  return cart.items
    .map((item): CartItemView | null => {
      const product = productMap.get(item.product.toString());
      if (!product) return null;
      const variant = product.variants.find((v) => v.value === item.variant);
      return {
        productId: product._id.toString(),
        slug: product.slug,
        title: product.title,
        image: product.images[0] ?? null,
        price: product.price + (variant?.priceDelta ?? 0),
        currency: product.currency,
        variant: item.variant ?? undefined,
        quantity: item.quantity,
        stock: variant?.stock ?? product.stock,
      };
    })
    .filter((i): i is CartItemView => i !== null);
}
