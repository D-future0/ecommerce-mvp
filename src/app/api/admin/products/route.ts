import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";

const variantSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
  priceDelta: z.number().default(0),
  stock: z.number().int().min(0),
  sku: z.string().min(1),
});

const productSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  description: z.string().min(1),
  price: z.number().int().min(0),
  compareAtPrice: z.number().int().min(0).optional(),
  currency: z.string().default("NGN"),
  images: z.array(z.string().url()).default([]),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  attributes: z.record(z.string()).default({}),
  variants: z.array(variantSchema).default([]),
  stock: z.number().int().min(0).default(0),
  featured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectToDatabase();
  const products = await Product.find().sort({ createdAt: -1 }).populate("category", "name slug").lean();
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await connectToDatabase();

  const existing = await Product.findOne({ slug: parsed.data.slug });
  if (existing) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });

  const product = await Product.create(parsed.data);
  return NextResponse.json({ product }, { status: 201 });
}
