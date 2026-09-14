import { NextRequest, NextResponse } from "next/server";
import { getProducts, SortOption } from "@/lib/products";
import { rateLimit } from "@/lib/redis";

const VALID_SORTS: SortOption[] = ["newest", "price_asc", "price_desc", "rating", "popular"];

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await rateLimit(`products:${ip}`, 60, 60);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const params = req.nextUrl.searchParams;
  const category = params.get("category") ?? undefined;
  const q = params.get("q") ?? undefined;
  const sortParam = params.get("sort") as SortOption | null;
  const sort = sortParam && VALID_SORTS.includes(sortParam) ? sortParam : "newest";
  const page = Math.max(Number(params.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(params.get("limit")) || 12, 1), 48);
  const minPrice = params.get("minPrice") ? Number(params.get("minPrice")) : undefined;
  const maxPrice = params.get("maxPrice") ? Number(params.get("maxPrice")) : undefined;

  // Any other query param is treated as a filter on Product.attributes,
  // e.g. ?color=black,blue&material=leather
  const reserved = new Set(["category", "q", "sort", "page", "limit", "minPrice", "maxPrice"]);
  const filters: Record<string, string[]> = {};
  for (const [key, value] of params.entries()) {
    if (!reserved.has(key)) filters[key] = value.split(",").filter(Boolean);
  }

  const result = await getProducts({
    categorySlug: category,
    q,
    sort,
    page,
    limit,
    minPrice,
    maxPrice,
    filters,
  });

  return NextResponse.json(result);
}
