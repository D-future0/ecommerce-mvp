import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { sendShippingUpdateEmail } from "@/lib/email";

const statusSchema = z.object({
  status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"]),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await connectToDatabase();
  const row = await Order.findUnique({
    where: { id: id },
    include: { userRef: { select: { name: true, email: true } } },
  });
  const order = row ? { ...row, user: row.userRef } : null;
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await connectToDatabase();
  const updated = await Order.updateMany({
    where: { id: id },
    data: { status: parsed.data.status },
  });
  if (!updated.count) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const order = await Order.findUnique({ where: { id: id } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.data.status === "shipped" || parsed.data.status === "delivered") {
    const user = await User.findUnique({
      where: { id: order.user },
      select: { name: true, email: true },
    });
    if (user?.email) {
      sendShippingUpdateEmail({
        to: user.email,
        customerName: user.name,
        reference: order.paystackReference,
        status: parsed.data.status,
      }).catch((err) => console.error("Shipping update email failed", err));
    }
  }

  return NextResponse.json({ order });
}
