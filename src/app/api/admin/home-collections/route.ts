import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { connectToDatabase } from "@/lib/db";
import { Collection } from "@/models/Collection";

const collectionSettingsSchema = z.object({
  collectionIds: z.array(
    z.object({
      id: z.string(),
      homeOrder: z.number().int().min(1).max(999),
      homeTheme: z.enum(["purple", "rose", "slate", "emerald", "gold"]),
      homeDisplayMode: z.enum(["grid", "carousel"]),
    })
  ),
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectToDatabase();
  const collections = await Collection.find().sort({ homeOrder: 1, title: 1 }).lean();
  return NextResponse.json({ collections: JSON.parse(JSON.stringify(collections)) });
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

  const orderedCollections = [...parsed.data.collectionIds].sort((a, b) => a.homeOrder - b.homeOrder);

  for (const [index, collection] of orderedCollections.entries()) {
    await Collection.findByIdAndUpdate(collection.id, {
      showOnHome: true,
      homeOrder: collection.homeOrder || index + 1,
      homeTheme: collection.homeTheme,
      homeDisplayMode: collection.homeDisplayMode,
    });
  }

  const selectedIds = parsed.data.collectionIds.map((collection) => collection.id);
  const allCollections = await Collection.find().lean();
  for (const collection of allCollections) {
    if (!selectedIds.includes(String(collection._id))) {
      await Collection.findByIdAndUpdate(collection._id, { showOnHome: false, homeOrder: 100 });
    }
  }

  return NextResponse.json({ ok: true });
}
