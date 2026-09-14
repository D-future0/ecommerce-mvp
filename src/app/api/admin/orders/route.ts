import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const status = req.nextUrl.searchParams.get("status");

  await connectToDatabase();
  const orders = await Order.find(status ? { status } : {})
    .sort({ createdAt: -1 })
    .limit(200)
    .populate("user", "name email")
    .lean();

  return NextResponse.json({ orders });
}
