import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const status = req.nextUrl.searchParams.get("status");

  await connectToDatabase();
  const rows = await Order.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { userRef: { select: { name: true, email: true } } },
  });
  const orders = rows.map(({ userRef, ...order }) => ({ ...order, user: userRef }));

  return NextResponse.json({ orders });
}
