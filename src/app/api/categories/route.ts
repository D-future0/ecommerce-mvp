import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Category } from "@/models/Category";

export async function GET() {
  await connectToDatabase();
  const categories = await Category.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ categories });
}
