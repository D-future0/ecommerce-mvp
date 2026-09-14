import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";
import { User } from "@/models/User";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    // Not signed in — recently-viewed is a logged-in feature for now, silently no-op.
    return NextResponse.json({ tracked: false });
  }

  const { slug } = await params;
  await connectToDatabase();

  const product = await Product.findOne({ slug }).select("_id").lean();
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  // Drop any existing entry for this product, then push it to the front, capped at 20.
  await User.findByIdAndUpdate(session.user.id, {
    $pull: { recentlyViewed: { product: product._id } },
  });
  await User.findByIdAndUpdate(session.user.id, {
    $push: {
      recentlyViewed: {
        $each: [{ product: product._id, viewedAt: new Date() }],
        $position: 0,
        $slice: 20,
      },
    },
  });

  return NextResponse.json({ tracked: true });
}
