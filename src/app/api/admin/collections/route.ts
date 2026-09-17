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

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectToDatabase();
  return NextResponse.json({ collections: await Collection.find().sort({ title: 1 }).lean() });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = collectionSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  await connectToDatabase();
  if (await Collection.exists({ slug: parsed.data.slug })) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }
  return NextResponse.json({ collection: await Collection.create(parsed.data) }, { status: 201 });
}
