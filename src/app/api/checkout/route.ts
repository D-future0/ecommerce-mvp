import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import crypto from "crypto";
import { authOptions } from "@/lib/auth";
import { getCartItems } from "@/lib/cart";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { initializeTransaction } from "@/lib/paystack";
import { getDeliveryFee, LAGOS_LGAS, NIGERIAN_STATES } from "@/lib/shipping";
import { rateLimit } from "@/lib/redis";

const checkoutSchema = z
  .object({
    deliveryMethod: z.enum(["store_pickup", "delivery"]).default("delivery"),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.enum(NIGERIAN_STATES).optional(),
    lga: z.string().optional(),
    country: z.literal("Nigeria").default("Nigeria"),
    phone: z.string().optional(),
    saveBillingAddress: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryMethod === "store_pickup") return;

    for (const field of ["firstName", "lastName", "line1", "city", "state", "phone"] as const) {
      if (!data[field]?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: "Required" });
    }
    if (!data.email) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["email"], message: "Required" });
    if (data.line1 && data.line1.trim().length < 3) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["line1"], message: "Required" });
    if (data.city && data.city.trim().length < 2) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["city"], message: "Required" });
    if (data.phone && data.phone.trim().length < 7) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phone"], message: "Required" });
    if (data.state === "Lagos" && (!data.lga || !(data.lga in LAGOS_LGAS))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["lga"], message: "Select a valid Lagos LGA" });
    }
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
  const parsed = checkoutSchema.safeParse(body);
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
  const isPickup = parsed.data.deliveryMethod === "store_pickup";
  const deliveryType = isPickup ? "store_pickup" : parsed.data.state === "Lagos" ? "door_to_door" : "terminal_pickup";
  const shippingFee = isPickup ? 0 : getDeliveryFee(parsed.data.state ?? "", parsed.data.lga);
  if (!isPickup && shippingFee === 0) {
    return NextResponse.json({ error: "Select a valid delivery location" }, { status: 400 });
  }
  const total = subtotal + shippingFee;
  const currency = cartItems[0].currency;
  const reference = `order_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;

  await connectToDatabase();

  const user = await User.findById(session.user.id).select("billingAddress");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (!isPickup && parsed.data.saveBillingAddress && !user.billingAddress) {
    user.billingAddress = {
      label: "Billing",
      line1: parsed.data.line1!.trim(),
      line2: parsed.data.line2?.trim() || undefined,
      city: parsed.data.city!.trim(),
      state: parsed.data.state!,
      country: parsed.data.country,
      phone: parsed.data.phone!.trim(),
    };
    await user.save();
  }

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
    deliveryMethod: isPickup ? "store_pickup" : "delivery",
    deliveryType,
    shippingAddress: isPickup
      ? { line1: "Pickup from store", city: "", state: "", country: "Nigeria", phone: "" }
      : { ...parsed.data, lga: parsed.data.state === "Lagos" ? parsed.data.lga : undefined },
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
