import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { connectToDatabase } from "@/lib/db";
import { Category } from "@/models/Category";

const collectionSettingsSchema = z.object({
  collectionIds: z.array(z.string()),
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectToDatabase();
  const collections = await Category.find({ parent: null }).sort({ homeOrder: 1, name: 1 }).lean();
  return NextResponse.json({ collections });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = collectionSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await connectToDatabase();

  for (const [index, collectionId] of parsed.data.collectionIds.entries()) {
    await Category.findByIdAndUpdate(collectionId, {
      showOnHome: true,
      homeOrder: index + 1,
    });
  }

  const allCollections = await Category.find().lean();
  for (const collection of allCollections) {
    if (!parsed.data.collectionIds.includes(String(collection._id))) {
      await Category.findByIdAndUpdate(collection._id, { showOnHome: false, homeOrder: 100 });
    }
  }

  return NextResponse.json({ ok: true });
}
