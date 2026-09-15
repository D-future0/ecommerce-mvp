import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { Review } from "@/models/Review";
import { rateLimit } from "@/lib/redis";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(10).max(2000),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();

  const product = await Product.findOne({ slug }).select("_id").lean();
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const reviews = await Review.find({ product: product._id })
    .sort({ createdAt: -1 })
    .populate("user", "name")
    .lean();

  return NextResponse.json({ reviews });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to leave a review" }, { status: 401 });
  }

  const { success } = await rateLimit(`review:${session.user.id}`, 10, 60 * 60);
  if (!success) {
    return NextResponse.json({ error: "Too many reviews submitted. Try again later." }, { status: 429 });
  }

  const { slug } = await params;
  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await connectToDatabase();
  const product = await Product.findOne({ slug }).select("_id").lean();
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const isAdmin = session.user.role === "admin";
  const hasPurchased = await Order.exists({
    user: session.user.id,
    status: { $in: ["paid", "processing", "shipped", "delivered"] },
    "items.product": product._id,
  });

  if (!isAdmin && !hasPurchased) {
    return NextResponse.json(
      { error: "Only verified buyers can leave a review for this product." },
      { status: 403 }
    );
  }

  try {
    const review = await Review.create({
      product: product._id,
      user: session.user.id,
      verifiedPurchase: !!hasPurchased,
      ...parsed.data,
    });
    return NextResponse.json({ review }, { status: 201 });
  } catch (err: any) {
    if (err?.code === 11000) {
      return NextResponse.json({ error: "You've already reviewed this product" }, { status: 409 });
    }
    throw err;
  }
}
