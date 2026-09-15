import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

const profileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  mobile: z.string().max(30).optional(),
  password: z.string().min(8).max(72).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await connectToDatabase();

  const user = await User.findById(session.user.id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.isDeactivated) {
    return NextResponse.json({ error: "This account has been deactivated." }, { status: 403 });
  }

  const { name, email, phone, mobile, password } = parsed.data;
  const nextEmail = email?.trim().toLowerCase();

  if (nextEmail && nextEmail !== user.email) {
    const existing = await User.findOne({ email: nextEmail, _id: { $ne: user._id } });
    if (existing) {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }
    user.email = nextEmail;
  }

  if (name) user.name = name.trim();
  if (typeof phone !== "undefined") user.phone = phone.trim();
  if (typeof mobile !== "undefined") user.mobile = mobile.trim();

  if (password && password.trim()) {
    user.passwordHash = await bcrypt.hash(password, 12);
  }

  await user.save();

  return NextResponse.json({ ok: true });
}
