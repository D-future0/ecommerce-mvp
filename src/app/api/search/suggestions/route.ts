import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { rateLimit } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return NextResponse.json({ products: [], categories: [] });

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await rateLimit(`search-suggestions:${ip}`, 60, 60);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  await connectToDatabase();
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(escaped, "i");

  const [products, categories] = await Promise.all([
    Product.find({ isActive: true, $or: [{ title: pattern }, { tags: pattern }, { description: pattern }] })
      .select("title slug price currency images")
      .sort({ soldCount: -1, title: 1 })
      .limit(6)
      .lean(),
    Category.find({ name: pattern }).select("name slug").sort({ name: 1 }).limit(4).lean(),
  ]);

  return NextResponse.json({ products, categories });
}
