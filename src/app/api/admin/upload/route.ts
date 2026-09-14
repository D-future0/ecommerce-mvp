import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { cloudinary } from "@/lib/cloudinary";
import { rateLimit } from "@/lib/redis";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { success } = await rateLimit(`upload:${admin.id}`, 30, 60);
  if (!success) return NextResponse.json({ error: "Too many uploads. Slow down." }, { status: 429 });

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, or GIF images are allowed" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 8MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "ecommerce-mvp/products",
      resource_type: "image",
    });
    return NextResponse.json({ url: result.secure_url });
  } catch (err) {
    console.error("Cloudinary upload failed", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 502 });
  }
}
