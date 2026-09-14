import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Cart } from "@/models/Cart";
import { Product } from "@/models/Product";
import { getCartItems } from "@/lib/cart";
import { rateLimit } from "@/lib/redis";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user;
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const items = await getCartItems(user.id);
  return NextResponse.json({ items });
}

const addSchema = z.object({
  productId: z.string(),
  variant: z.string().optional(),
  quantity: z.number().int().min(1).max(20).default(1),
});

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { success } = await rateLimit(`cart:${user.id}`, 30, 60);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json();
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { productId, variant, quantity } = parsed.data;

  await connectToDatabase();
  const product = await Product.findById(productId).lean();
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const cart = await Cart.findOneAndUpdate(
    { user: user.id, "items.product": productId, "items.variant": variant ?? null },
    { $inc: { "items.$.quantity": quantity } },
    { new: true }
  );

  if (!cart) {
    await Cart.findOneAndUpdate(
      { user: user.id },
      { $push: { items: { product: productId, variant: variant ?? null, quantity } } },
      { upsert: true }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

const updateSchema = z.object({
  productId: z.string(),
  variant: z.string().optional(),
  quantity: z.number().int().min(1).max(20),
});

export async function PATCH(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { productId, variant, quantity } = parsed.data;

  await connectToDatabase();
  await Cart.findOneAndUpdate(
    { user: user.id, "items.product": productId, "items.variant": variant ?? null },
    { $set: { "items.$.quantity": quantity } }
  );

  return NextResponse.json({ ok: true });
}

const removeSchema = z.object({
  productId: z.string(),
  variant: z.string().optional(),
});

export async function DELETE(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json();
  const parsed = removeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { productId, variant } = parsed.data;

  await connectToDatabase();
  await Cart.findOneAndUpdate(
    { user: user.id },
    { $pull: { items: { product: productId, variant: variant ?? null } } }
  );

  return NextResponse.json({ ok: true });
}
