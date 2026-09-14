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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectToDatabase();
  const banner = await Banner.findById((await params).id).lean();
  if (!banner) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ banner });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = bannerSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await connectToDatabase();
  const banner = await Banner.findByIdAndUpdate((await params).id, parsed.data, { new: true }).lean();
  if (!banner) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ banner });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectToDatabase();
  const banner = await Banner.findByIdAndDelete((await params).id);
  if (!banner) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
