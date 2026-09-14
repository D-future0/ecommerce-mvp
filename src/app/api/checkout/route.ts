import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import crypto from "crypto";
import { authOptions } from "@/lib/auth";
import { getCartItems } from "@/lib/cart";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import { initializeTransaction } from "@/lib/paystack";
import { getShippingFee } from "@/lib/shipping";
import { rateLimit } from "@/lib/redis";

const addressSchema = z.object({
  line1: z.string().min(3),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  country: z.string().min(2),
  phone: z.string().min(7),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { success } = await rateLimit(`checkout:${session.user.id}`, 10, 60 * 5);
  if (!success) {
    return NextResponse.json({ error: "Too many checkout attempts. Try again shortly." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const cartItems = await getCartItems(session.user.id);
  if (cartItems.length === 0) {
    return NextResponse.json({ error: "Your bag is empty" }, { status: 400 });
  }

  for (const item of cartItems) {
    if (item.quantity > item.stock) {
      return NextResponse.json(
        { error: `${item.title} only has ${item.stock} left in stock` },
        { status: 409 }
      );
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = getShippingFee(parsed.data.state, parsed.data.country);
  const total = subtotal + shippingFee;
  const currency = cartItems[0].currency;
  const reference = `order_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;

  await connectToDatabase();

  const order = await Order.create({
    user: session.user.id,
    items: cartItems.map((item) => ({
      product: item.productId,
      title: item.title,
      image: item.image ?? "",
      variant: item.variant,
      price: item.price,
      quantity: item.quantity,
    })),
    subtotal,
    shippingFee,
    total,
    currency,
    status: "pending",
    shippingAddress: parsed.data,
    paystackReference: reference,
  });

  const origin = req.nextUrl.origin;
  const init = await initializeTransaction({
    email: session.user.email,
    amountKobo: total,
    reference,
    callbackUrl: `${origin}/checkout/return?reference=${reference}`,
  });

  if (!init.status || !init.data) {
    order.status = "cancelled";
    await order.save();
    return NextResponse.json({ error: init.message || "Could not start payment" }, { status: 502 });
  }

  order.paystackAuthorizationUrl = init.data.authorization_url;
  await order.save();

  return NextResponse.json({ authorizationUrl: init.data.authorization_url, reference });
}
