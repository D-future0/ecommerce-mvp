import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { connectToDatabase } from "@/lib/db";
import { Category } from "@/models/Category";

const filterSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  options: z.array(z.string()).default([]),
});

const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  description: z.string().optional(),
  image: z.string().url().optional().or(z.literal("")),
  parent: z.string().nullable().default(null),
  filters: z.array(filterSchema).default([]),
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectToDatabase();
  const categories = await Category.find().sort({ name: 1 }).lean();
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await connectToDatabase();

  if (parsed.data.parent) {
    const parent = await Category.exists({ _id: parsed.data.parent });
    if (!parent) return NextResponse.json({ error: "Parent category not found" }, { status: 400 });
  }

  const existing = await Category.findOne({ slug: parsed.data.slug });
  if (existing) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });

  const category = await Category.create({ ...parsed.data, parent: parsed.data.parent || null });
  return NextResponse.json({ category }, { status: 201 });
}
