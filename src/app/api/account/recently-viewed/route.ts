import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ products: [] });

  await connectToDatabase();
  const user = await User.findById(session.user.id)
    .select("recentlyViewed")
    .populate({
      path: "recentlyViewed.product",
      select: "title slug price compareAtPrice currency images ratingAverage ratingCount attributes isActive",
    })
    .lean();

  const products = (user?.recentlyViewed ?? [])
    .map((entry) => entry.product)
    .filter((product) => product && "isActive" in product && product.isActive)
    .slice(0, 8);

  return NextResponse.json({ products: JSON.parse(JSON.stringify(products)) });
}
