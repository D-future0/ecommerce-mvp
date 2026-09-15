/**
 * Seeds a richer storefront catalog with multiple collections and products so the app
 * feels like a mature storefront instead of a single-category demo. Run with `npm run seed`.
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

const collections = [
  {
    slug: "bags",
    name: "Bags",
    description: "Structured carry for daily life, light travel, and refined essentials.",
    filters: [
      { key: "color", label: "Color", options: ["Black", "Tan", "Olive", "Sand"] },
      { key: "material", label: "Material", options: ["Leather", "Canvas"] },
    ],
    products: [
      {
        title: "Field Tote",
        slug: "field-tote",
        description: "A structured tote built for daily use with a waxed canvas shell and leather base.",
        price: 4500000,
        compareAtPrice: 5200000,
        images: [],
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
        description: "Full-grain leather duffel with brass hardware and a detachable shoulder strap.",
        price: 8900000,
        images: [],
        tags: ["duffel", "travel"],
        attributes: { color: "Black", material: "Leather" },
        variants: [{ name: "Color", value: "Black", stock: 5, sku: "DUFFEL-BLK" }],
        stock: 5,
        featured: true,
      },
      {
        title: "City Sling",
        slug: "city-sling",
        description: "Compact crossbody for city commutes with a secure zip front and soft edges.",
        price: 3700000,
        images: [],
        tags: ["crossbody", "commute"],
        attributes: { color: "Sand", material: "Canvas" },
        variants: [{ name: "Color", value: "Sand", stock: 9, sku: "SLING-SAND" }],
        stock: 9,
        featured: false,
      },
    ],
  },
  {
    slug: "accessories",
    name: "Accessories",
    description: "Pocket-sized pieces and everyday essentials built to complement the collection.",
    filters: [
      { key: "color", label: "Color", options: ["Black", "Tan", "Ivory"] },
      { key: "type", label: "Type", options: ["Wallet", "Key Holder", "Travel" ] },
    ],
    products: [
      {
        title: "Minimal Card Holder",
        slug: "minimal-card-holder",
        description: "Slim, four-card leather holder with a center pull-tab and hand-burnished edges.",
        price: 950000,
        images: [],
        tags: ["accessories", "wallet"],
        attributes: { color: "Black", type: "Wallet" },
        variants: [
          { name: "Color", value: "Black", stock: 20, sku: "CARD-BLK" },
          { name: "Color", value: "Tan", stock: 0, sku: "CARD-TAN" },
        ],
        stock: 20,
        featured: true,
      },
      {
        title: "Key Lanyard",
        slug: "key-lanyard",
        description: "Compact woven key holder with sturdy hardware and a clean profile.",
        price: 720000,
        images: [],
        tags: ["accessories", "key"],
        attributes: { color: "Ivory", type: "Key Holder" },
        variants: [{ name: "Color", value: "Ivory", stock: 14, sku: "KEY-IVORY" }],
        stock: 14,
        featured: false,
      },
      {
        title: "Passport Sleeve",
        slug: "passport-sleeve",
        description: "A slim travel sleeve for passports, boarding passes, and a few cards.",
        price: 1400000,
        images: [],
        tags: ["travel", "passport"],
        attributes: { color: "Black", type: "Travel" },
        variants: [{ name: "Color", value: "Black", stock: 11, sku: "PASSPORT-BLK" }],
        stock: 11,
        featured: false,
      },
    ],
  },
  {
    slug: "travel",
    name: "Travel",
    description: "Travel-ready essentials built for short trips, weekend escapes, and organized carry.",
    filters: [
      { key: "color", label: "Color", options: ["Black", "Forest", "Stone"] },
      { key: "use", label: "Use", options: ["Weekend", "Business", "Daily"] },
    ],
    products: [
      {
        title: "Long Haul Packing Cube",
        slug: "long-haul-packing-cube",
        description: "Structured packing cube with breathable mesh panels and a zip-top closure.",
        price: 2400000,
        images: [],
        tags: ["travel", "packing"],
        attributes: { color: "Forest", use: "Weekend" },
        variants: [{ name: "Color", value: "Forest", stock: 10, sku: "PACK-FOR" }],
        stock: 10,
        featured: true,
      },
      {
        title: "Convertible Trip Pouch",
        slug: "convertible-trip-pouch",
        description: "A soft zip pouch designed to hold tech, toiletries, and travel documents.",
        price: 1900000,
        images: [],
        tags: ["travel", "tech"],
        attributes: { color: "Stone", use: "Business" },
        variants: [{ name: "Color", value: "Stone", stock: 8, sku: "TRIP-STONE" }],
        stock: 8,
        featured: false,
      },
      {
        title: "Weekend Carrier",
        slug: "weekend-carrier",
        description: "A roomy weekend carrier with a compact profile and easy-wipe internal lining.",
        price: 3100000,
        images: [],
        tags: ["travel", "weekend"],
        attributes: { color: "Black", use: "Daily" },
        variants: [{ name: "Color", value: "Black", stock: 7, sku: "CARRIER-BLK" }],
        stock: 7,
        featured: false,
      },
    ],
  },
  {
    slug: "everyday-carry",
    name: "Everyday Carry",
    description: "Practical pieces for commutes, errands, and the rhythm of everyday life.",
    filters: [
      { key: "color", label: "Color", options: ["Black", "Navy", "Stone"] },
      { key: "use", label: "Use", options: ["Commute", "Daily", "Outdoor"] },
    ],
    products: [
      {
        title: "Daily Utility Pouch",
        slug: "daily-utility-pouch",
        description: "A compact organizer for cables, keys, cards, and other daily essentials.",
        price: 1250000,
        images: [],
        tags: ["everyday", "organizer", "commute"],
        attributes: { color: "Navy", use: "Commute" },
        variants: [{ name: "Color", value: "Navy", stock: 15, sku: "POUCH-NAVY" }],
        stock: 15,
        featured: true,
      },
      {
        title: "Canvas Utility Belt",
        slug: "canvas-utility-belt",
        description: "A lightweight utility belt with quick-access pockets for hands-free days.",
        price: 1800000,
        images: [],
        tags: ["everyday", "utility", "outdoor"],
        attributes: { color: "Stone", use: "Outdoor" },
        variants: [{ name: "Color", value: "Stone", stock: 10, sku: "BELT-STONE" }],
        stock: 10,
        featured: false,
      },
      {
        title: "Compact Water Bottle",
        slug: "compact-water-bottle",
        description: "A durable insulated bottle sized for desk drawers, side pockets, and short walks.",
        price: 1650000,
        images: [],
        tags: ["everyday", "bottle", "daily"],
        attributes: { color: "Black", use: "Daily" },
        variants: [{ name: "Color", value: "Black", stock: 18, sku: "BOTTLE-BLK" }],
        stock: 18,
        featured: false,
      },
      {
        title: "Foldable Market Tote",
        slug: "foldable-market-tote",
        description: "A packable tote that opens wide for groceries, books, and spontaneous finds.",
        price: 1100000,
        images: [],
        tags: ["everyday", "tote", "market"],
        attributes: { color: "Navy", use: "Daily" },
        variants: [{ name: "Color", value: "Navy", stock: 13, sku: "MARKET-NAVY" }],
        stock: 13,
        featured: false,
      },
    ],
  },
  {
    slug: "desk-essentials",
    name: "Desk Essentials",
    description: "Thoughtful tools and accessories for a calmer, more considered workspace.",
    filters: [
      { key: "color", label: "Color", options: ["Black", "Walnut", "Ivory"] },
      { key: "type", label: "Type", options: ["Stationery", "Organization", "Tech"] },
    ],
    products: [
      {
        title: "Leather Desk Mat",
        slug: "leather-desk-mat",
        description: "A smooth leather work surface that gives notebooks, keyboards, and sketches room to breathe.",
        price: 2900000,
        images: [],
        tags: ["desk", "leather", "workspace"],
        attributes: { color: "Walnut", type: "Organization" },
        variants: [{ name: "Color", value: "Walnut", stock: 8, sku: "MAT-WALNUT" }],
        stock: 8,
        featured: true,
      },
      {
        title: "Cable Keeper Set",
        slug: "cable-keeper-set",
        description: "A set of soft cable keepers that keeps chargers and cords tidy without tangles.",
        price: 650000,
        images: [],
        tags: ["desk", "tech", "organization"],
        attributes: { color: "Black", type: "Tech" },
        variants: [{ name: "Color", value: "Black", stock: 25, sku: "CABLE-BLK" }],
        stock: 25,
        featured: false,
      },
      {
        title: "Bound Daily Notebook",
        slug: "bound-daily-notebook",
        description: "A cloth-bound notebook with thick paper for plans, lists, and loose ideas.",
        price: 850000,
        images: [],
        tags: ["desk", "stationery", "notebook"],
        attributes: { color: "Ivory", type: "Stationery" },
        variants: [{ name: "Color", value: "Ivory", stock: 22, sku: "NOTE-IVORY" }],
        stock: 22,
        featured: false,
      },
    ],
  },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MONGODB_URI before seeding");

  await mongoose.connect(uri);

  let totalProducts = 0;

  for (const collection of collections) {
    const category = await Category.findOneAndUpdate(
      { slug: collection.slug },
      {
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        filters: collection.filters,
      },
      { upsert: true, new: true }
    );

    for (const product of collection.products) {
      await Product.findOneAndUpdate(
        { slug: product.slug },
        {
          ...product,
          category: category._id,
          currency: "NGN",
          reviewsEnabled: true,
        },
        { upsert: true, new: true }
      );
      totalProducts += 1;
    }

    console.log(`Seeded collection "${category.name}" with ${collection.products.length} products.`);
  }

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

  console.log(`Finished seeding ${totalProducts} products across ${collections.length} collections.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
