import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

const addressSchema = z.object({
  label: z.string().min(1).max(50).default("Home"),
  line1: z.string().min(3),
  line2: z.string().optional().or(z.literal("")),
  city: z.string().min(2),
  state: z.string().min(2),
  country: z.string().min(2).default("Nigeria"),
  phone: z.string().min(7),
  isDefault: z.boolean().optional().default(true),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = addressSchema.safeParse(body);
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

  const address = {
    label: parsed.data.label.trim(),
    line1: parsed.data.line1.trim(),
    line2: parsed.data.line2?.trim() || undefined,
    city: parsed.data.city.trim(),
    state: parsed.data.state.trim(),
    country: parsed.data.country.trim(),
    phone: parsed.data.phone.trim(),
    isDefault: !!parsed.data.isDefault,
  };

  const existing = user.addresses ?? [];
  if (address.isDefault) {
    existing.forEach((item) => {
      item.isDefault = false;
    });
  }

  user.addresses = [...existing, address];
  await user.save();

  return NextResponse.json({ ok: true, address });
}
