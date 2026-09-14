import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import { verifyTransaction } from "@/lib/paystack";
import { markOrderPaid } from "@/lib/orders";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { reference } = await params;

  await connectToDatabase();
  let order = await Order.findOne({ paystackReference: reference, user: session.user.id }).lean();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // If the webhook hasn't landed yet, actively verify with Paystack rather
  // than leaving the customer staring at "pending" on the return page.
  if (order.status === "pending") {
    const verification = await verifyTransaction(reference);
    if (verification.data?.status === "success") {
      await markOrderPaid(reference);
      order = await Order.findOne({ paystackReference: reference }).lean();
    } else if (verification.data?.status === "failed" || verification.data?.status === "abandoned") {
      await Order.updateOne({ paystackReference: reference }, { status: "cancelled" });
      order = await Order.findOne({ paystackReference: reference }).lean();
    }
  }

  return NextResponse.json({ order });
}
