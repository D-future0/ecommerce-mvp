import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { rateLimit } from "@/lib/redis";

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await rateLimit(`register:${ip}`, 5, 60 * 60);
  if (!success) {
    return NextResponse.json(
      { error: "Too many signup attempts. Try again later." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  await connectToDatabase();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
  });

  return NextResponse.json(
    { id: user._id.toString(), name: user.name, email: user.email },
    { status: 201 }
  );
}
