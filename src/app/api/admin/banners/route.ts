import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { connectToDatabase } from "@/lib/db";
import { Banner } from "@/models/Banner";

const bannerSchema = z.object({
  title: z.string().min(2).max(120),
  subtitle: z.string().max(240).optional(),
  image: z.string().url(),
  href: z.string().max(500).optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectToDatabase();
  const banners = await Banner.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
  return NextResponse.json({ banners });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = bannerSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await connectToDatabase();
  const banner = await Banner.create(parsed.data);
  return NextResponse.json({ banner }, { status: 201 });
}
