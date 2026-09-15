import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { connectToDatabase } from "@/lib/db";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";

const filterSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  options: z.array(z.string()).default([]),
});

const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  image: z.string().url().optional().or(z.literal("")),
  parent: z.string().nullable().default(null),
  filters: z.array(filterSchema).default([]),
  showOnHome: z.boolean().optional().default(false),
  homeOrder: z.number().int().min(1).max(999).optional().default(100),
  homeTheme: z.enum(["purple", "rose", "slate", "emerald", "gold"]).optional().default("purple"),
  homeDisplayMode: z.enum(["grid", "carousel"]).optional().default("grid"),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await connectToDatabase();
  const category = await Category.findById(id).lean();
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ category });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await connectToDatabase();

  if (parsed.data.parent) {
    if (parsed.data.parent === id) {
      return NextResponse.json({ error: "A category cannot be its own parent" }, { status: 400 });
    }
    const parent = await Category.exists({ _id: parsed.data.parent });
    if (!parent) return NextResponse.json({ error: "Parent category not found" }, { status: 400 });
  }

  const conflict = await Category.findOne({ slug: parsed.data.slug, _id: { $ne: id } });
  if (conflict) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });

  const category = await Category.findByIdAndUpdate(
    id,
    { ...parsed.data, parent: parsed.data.parent || null },
    { new: true }
  );
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ category });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await connectToDatabase();

  const inUse = await Product.countDocuments({ category: id });
  if (inUse > 0) {
    return NextResponse.json(
      { error: `${inUse} product(s) still use this category` },
      { status: 409 }
    );
  }

  const childCount = await Category.countDocuments({ parent: id });
  if (childCount > 0) {
    return NextResponse.json(
      { error: `${childCount} child categor${childCount === 1 ? "y" : "ies"} still use this category` },
      { status: 409 }
    );
  }

  await Category.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
