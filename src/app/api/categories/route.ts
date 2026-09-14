import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Category } from "@/models/Category";

export async function GET() {
  await connectToDatabase();
  const categories = await Category.find().sort({ name: 1 }).lean();
  return NextResponse.json({ categories });
}
