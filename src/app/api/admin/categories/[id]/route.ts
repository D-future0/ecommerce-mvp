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
  featured: z.boolean().optional().default(false),
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
  const category = await Category.findUnique({ where: { id: id } });
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
    const parent = await Category.findUnique({
      where: { id: parsed.data.parent },
      select: { id: true },
    });
    if (!parent) return NextResponse.json({ error: "Parent category not found" }, { status: 400 });
  }

  const conflict = await Category.findFirst({
    where: { slug: parsed.data.slug, id: { not: id } },
  });
  if (conflict) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });

  const updated = await Category.updateMany({
    where: { id: id },
    data: { ...parsed.data, parent: parsed.data.parent || null },
  });
  if (!updated.count) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const category = await Category.findUnique({ where: { id: id } });

  return NextResponse.json({ category });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await connectToDatabase();

  const categoryToDelete = await Category.findUnique({
    where: { id: id },
    select: { slug: true },
  });
  if (!categoryToDelete) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (categoryToDelete.slug === "uncategorized") {
    return NextResponse.json({ error: "The Uncategorized category cannot be deleted" }, { status: 400 });
  }

  let replacementCategoryId: string | undefined;
  try {
    const body = await _req.json();
    replacementCategoryId = typeof body.replacementCategoryId === "string" ? body.replacementCategoryId : undefined;
  } catch {
    // An empty request body is valid when the category has no products.
  }

  if (replacementCategoryId) {
    if (replacementCategoryId === id) {
      return NextResponse.json({ error: "Choose a different category" }, { status: 400 });
    }
    const replacement = await Category.findUnique({
      where: { id: replacementCategoryId },
      select: { id: true },
    });
    if (!replacement) return NextResponse.json({ error: "Replacement category not found" }, { status: 400 });
  }

  const childCount = await Category.count({ where: { parent: id } });
  if (childCount > 0) {
    return NextResponse.json(
      { error: `${childCount} child categor${childCount === 1 ? "y" : "ies"} still use this category` },
      { status: 409 }
    );
  }

  const inUse = await Product.count({ where: { category: id } });
  if (inUse > 0) {
    const fallback = replacementCategoryId
      ? null
      : await Category.upsert({
          where: { slug: "uncategorized" },
          create: {
            name: "Uncategorized",
            slug: "uncategorized",
            description: "Products awaiting a category assignment.",
            filters: [],
          },
          update: { slug: "uncategorized" },
        });
    const targetCategoryId = replacementCategoryId ?? fallback?.id;
    if (!targetCategoryId) return NextResponse.json({ error: "Couldn't create the fallback category" }, { status: 500 });
    await Product.updateMany({ where: { category: id }, data: { category: targetCategoryId } });
  }

  await Category.delete({ where: { id: id } });
  return NextResponse.json({ ok: true });
}
