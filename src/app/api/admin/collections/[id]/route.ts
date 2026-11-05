import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { connectToDatabase } from "@/lib/db";
import { Collection } from "@/models/Collection";

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
  const collection = await Collection.findUnique({ where: { id: (await params).id } });
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
  if (await Collection.findFirst({ where: { slug: parsed.data.slug, id: { not: id } } })) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }
  const updated = await Collection.updateMany({ where: { id: id }, data: parsed.data });
  if (!updated.count) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const collection = await Collection.findUnique({ where: { id: id } });
  return NextResponse.json({ collection });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = (await params).id;
  await connectToDatabase();
  const collection = await Collection.deleteMany({ where: { id: id } });
  if (!collection.count) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
