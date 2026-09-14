import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { markOrderPaid } from "@/lib/orders";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  const expected = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY as string)
    .update(rawBody)
    .digest("hex");

  if (!signature || signature !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "charge.success" && event.data?.status === "success") {
    await markOrderPaid(event.data.reference);
  }

  // Paystack just needs a 200 to stop retrying — order status changes are
  // read by the client from GET /api/checkout/[reference].
  return NextResponse.json({ received: true });
}
