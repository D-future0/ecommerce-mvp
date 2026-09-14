import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  await connectToDatabase();
  const user = await User.findById(session.user.id).populate("wishlist").lean();

  return NextResponse.json({ products: user?.wishlist ?? [] });
}
