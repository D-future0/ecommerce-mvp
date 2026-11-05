import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { Product } from "@/models/Product";
import { parseRecentlyViewed } from "@/lib/user-data";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ products: [] });

  await connectToDatabase();
  const user = await User.findUnique({
    where: { id: session.user.id },
    select: { recentlyViewed: true },
  });
  const entries = parseRecentlyViewed(user?.recentlyViewed ?? []);
  const viewedProducts = await Product.findMany({
    where: { id: { in: entries.map((entry) => entry.product) }, isActive: true },
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      compareAtPrice: true,
      currency: true,
      images: true,
      ratingAverage: true,
      ratingCount: true,
      attributes: true,
      isActive: true,
    },
  });
  const byId = new Map(viewedProducts.map((product) => [product.id, product]));
  const products = entries
    .map((entry) => byId.get(entry.product))
    .filter((product) => product !== undefined)
    .slice(0, 8);

  return NextResponse.json({ products });
}
