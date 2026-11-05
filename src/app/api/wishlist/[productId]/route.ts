import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { rateLimit } from "@/lib/redis";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { success } = await rateLimit(`wishlist:${session.user.id}`, 30, 60);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { productId } = await params;

  await connectToDatabase();
  const user = await User.findUnique({
    where: { id: session.user.id },
    select: { wishlist: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isWishlisted = user.wishlist.includes(productId);
  const wishlist = isWishlisted
    ? user.wishlist.filter((id) => id !== productId)
    : [...user.wishlist, productId];
  await User.update({ where: { id: session.user.id }, data: { wishlist } });

  return NextResponse.json({ wishlisted: !isWishlisted });
}
