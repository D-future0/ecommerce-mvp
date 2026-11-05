import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { parseRecentlyViewed } from "@/lib/user-data";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    // Not signed in — recently-viewed is a logged-in feature for now, silently no-op.
    return NextResponse.json({ tracked: false });
  }

  const { slug } = await params;
  await connectToDatabase();

  const product = await Product.findUnique({ where: { slug }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const user = await User.findUnique({
    where: { id: session.user.id },
    select: { recentlyViewed: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const recentlyViewed = [
    { product: product.id, viewedAt: new Date().toISOString() },
    ...parseRecentlyViewed(user.recentlyViewed)
      .filter((entry) => entry.product !== product.id)
      .map((entry) => ({ product: entry.product, viewedAt: entry.viewedAt })),
  ].slice(0, 20);
  await User.update({
    where: { id: session.user.id },
    data: { recentlyViewed },
  });

  return NextResponse.json({ tracked: true });
}
