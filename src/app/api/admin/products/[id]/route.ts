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

const productUpdateSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await connectToDatabase();
  const product = await Product.findById(id).lean();
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = productUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await connectToDatabase();

  const conflict = await Product.findOne({ slug: parsed.data.slug, _id: { $ne: id } });
  if (conflict) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });

  const product = await Product.findByIdAndUpdate(id, parsed.data, { new: true });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ product });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await connectToDatabase();
  await Product.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
