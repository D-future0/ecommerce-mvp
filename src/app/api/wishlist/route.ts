import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { Product } from "@/models/Product";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  await connectToDatabase();
  const user = await User.findUnique({
    where: { id: session.user.id },
    select: { wishlist: true },
  });

  const products = user?.wishlist.length
    ? await Product.findMany({ where: { id: { in: user.wishlist } } })
    : [];
  return NextResponse.json({ products });
}
