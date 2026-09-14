/**
 * Seeds one category (with filter config) and a handful of products so you
 * can actually see the catalog/product pages render. Run with `npm run seed`.
 * Safe to re-run — it upserts by slug.
 */
import { config } from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Category } from "../models/Category";
import { Product } from "../models/Product";
import { User } from "../models/User";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MONGODB_URI before seeding");

  await mongoose.connect(uri);

  const category = await Category.findOneAndUpdate(
    { slug: "bags" },
    {
      name: "Bags",
      slug: "bags",
      description: "Everyday carry, made from full-grain leather and recycled canvas.",
      filters: [
        { key: "color", label: "Color", options: ["Black", "Tan", "Olive"] },
        { key: "material", label: "Material", options: ["Leather", "Canvas"] },
      ],
    },
    { upsert: true, new: true }
  );

  const products = [
    {
      title: "Field Tote",
      slug: "field-tote",
      description:
        "A structured tote built for daily use — full-grain leather base, waxed canvas body, and an interior slip pocket for your laptop.",
      price: 4500000, // in kobo => ₦45,000
      compareAtPrice: 5200000,
      images: [],
      category: category._id,
      tags: ["tote", "everyday", "work"],
      attributes: { color: "Tan", material: "Canvas" },
      variants: [
        { name: "Color", value: "Tan", stock: 12, sku: "TOTE-TAN" },
        { name: "Color", value: "Olive", stock: 6, sku: "TOTE-OLIVE" },
      ],
      stock: 18,
      featured: true,
    },
    {
      title: "Weekender Duffel",
      slug: "weekender-duffel",
      description:
        "Full-grain leather duffel with brass hardware and a detachable shoulder strap. Fits airline carry-on sizing.",
      price: 8900000,
      images: [],
      category: category._id,
      tags: ["duffel", "travel"],
      attributes: { color: "Black", material: "Leather" },
      variants: [{ name: "Color", value: "Black", stock: 5, sku: "DUFFEL-BLK" }],
      stock: 5,
      featured: true,
    },
    {
      title: "Minimal Card Holder",
      slug: "minimal-card-holder",
      description: "Slim, four-card leather holder with a center pull-tab.",
      price: 950000,
      images: [],
      category: category._id,
      tags: ["accessories", "wallet"],
      attributes: { color: "Black", material: "Leather" },
      variants: [
        { name: "Color", value: "Black", stock: 20, sku: "CARD-BLK" },
        { name: "Color", value: "Tan", stock: 0, sku: "CARD-TAN" },
      ],
      stock: 20,
      featured: false,
    },
  ];

  for (const p of products) {
    await Product.findOneAndUpdate({ slug: p.slug }, p, { upsert: true, new: true });
  }

  console.log(`Seeded category "${category.name}" with ${products.length} products.`);

  // Optionally bootstrap an admin account: set ADMIN_EMAIL / ADMIN_PASSWORD
  // in .env.local before running `npm run seed`. Safe to re-run — it just
  // promotes the existing user to admin if the account already exists.
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await User.findOneAndUpdate(
      { email: adminEmail.toLowerCase() },
      { $set: { role: "admin" }, $setOnInsert: { name: "Admin", passwordHash } },
      { upsert: true }
    );
    console.log(`Admin account ready: ${adminEmail}`);
  } else {
    console.log("No ADMIN_EMAIL/ADMIN_PASSWORD set — sign up normally, then flip role to \"admin\" in MongoDB to reach /admin.");
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
