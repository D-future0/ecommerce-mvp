import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { connectToDatabase, prisma } from "@/lib/db";
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
  const product = await Product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.upsert({
      where: { user: user.id },
      create: { user: user.id },
      update: { updatedAt: new Date() },
    });
    const variantKey = variant ?? "";
    const where = {
      cartId_product_variant: {
        cartId: cart.id,
        product: productId,
        variant: variantKey,
      },
    };
    const position = await tx.cartItem.count({ where: { cartId: cart.id } });
    await tx.cartItem.upsert({
      where,
      create: {
        cartId: cart.id,
        product: productId,
        variant: variantKey,
        quantity,
        position,
      },
      update: { quantity: { increment: quantity } },
    });
  });

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
  const cart = await Cart.findUnique({ where: { user: user.id } });
  if (cart) {
    await prisma.cartItem.updateMany({
      where: { cartId: cart.id, product: productId, variant: variant ?? "" },
      data: { quantity },
    });
  }

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
  const cart = await Cart.findUnique({ where: { user: user.id } });
  if (cart) {
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id, product: productId, variant: variant ?? "" },
    });
  }

  return NextResponse.json({ ok: true });
}
