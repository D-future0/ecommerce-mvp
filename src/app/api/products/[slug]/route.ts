import { NextRequest, NextResponse } from "next/server";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const related = await getRelatedProducts(product);

  return NextResponse.json({ product, related });
}
