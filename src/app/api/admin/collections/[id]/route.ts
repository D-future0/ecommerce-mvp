import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { connectToDatabase } from "@/lib/db";
import { Collection } from "@/models/Collection";
import { Product } from "@/models/Product";

const collectionSchema = z.object({
  title: z.string().min(2).max(100),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  image: z.string().url().optional().or(z.literal("")),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectToDatabase();
  const collection = await Collection.findById((await params).id).lean();
  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ collection });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = collectionSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const id = (await params).id;
  await connectToDatabase();
  if (await Collection.exists({ slug: parsed.data.slug, _id: { $ne: id } })) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }
  const collection = await Collection.findByIdAndUpdate(id, parsed.data, { new: true }).lean();
  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ collection });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = (await params).id;
  await connectToDatabase();
  await Product.updateMany({ collections: id }, { $pull: { collections: id } });
  const collection = await Collection.findByIdAndDelete(id);
  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
