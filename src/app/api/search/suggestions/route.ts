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
  const [products, categories] = await Promise.all([
    Product.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { tags: { has: query } },
        ],
      },
      select: { title: true, slug: true, price: true, currency: true, images: true },
      orderBy: [{ soldCount: "desc" }, { title: "asc" }],
      take: 6,
    }),
    Category.findMany({
      where: { name: { contains: query, mode: "insensitive" } },
      select: { name: true, slug: true },
      orderBy: { name: "asc" },
      take: 4,
    }),
  ]);

  return NextResponse.json({ products, categories });
}
