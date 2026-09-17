/**
 * Seeds the storefront catalog with the requested category tree and featured
 * collections. Run with `npm run seed`. Safe to re-run — it upserts by slug.
 */
import { config } from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Category } from "../models/Category";
import { Collection } from "../models/Collection";
import { Product } from "../models/Product";
import { User } from "../models/User";

config({ path: ".env.local" });
config({ path: ".env" });

type SeedProduct = {
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  tags: string[];
  attributes: Record<string, string>;
  variants: Array<{ name: string; value: string; stock: number; sku: string }>;
  stock: number;
  featured: boolean;
};

type SeedCategory = {
  slug: string;
  name: string;
  description: string;
  featured?: boolean;
  homeTheme?: "purple" | "rose" | "slate" | "emerald" | "gold";
  filters?: Array<{ key: string; label: string; options: string[] }>;
  products?: SeedProduct[];
  subcategories?: string[];
};

const topLevelCollections: SeedCategory[] = [
  {
    slug: "everyday-essentials",
    name: "Everyday Essentials",
    description: "Easy wardrobe staples designed for daily movement, comfort, and balance.",
    featured: true,
    homeTheme: "emerald",
    products: [
      {
        title: "Satin Everyday Tank",
        slug: "satin-everyday-tank",
        description: "A soft silhouette with a fluid drape that transitions from errands to evening plans.",
        price: 1650000,
        compareAtPrice: 2200000,
        images: [],
        tags: ["women", "everyday", "tops"],
        attributes: { color: "Ivory", size: "M" },
        variants: [{ name: "Size", value: "M", stock: 12, sku: "TANK-IVORY-M" }],
        stock: 12,
        featured: true,
      },
      {
        title: "Relaxed Utility Shorts",
        slug: "relaxed-utility-shorts",
        description: "Lightweight shorts cut for movement, travel, and warm-weather layering.",
        price: 1850000,
        images: [],
        tags: ["women", "shorts", "summer"],
        attributes: { color: "Stone", size: "L" },
        variants: [{ name: "Size", value: "L", stock: 10, sku: "SHORTS-STONE-L" }],
        stock: 10,
        featured: true,
      },
      {
        title: "Soft Knit Set",
        slug: "soft-knit-set",
        description: "Co-ord set made for easy styling with a polished everyday finish.",
        price: 2400000,
        images: [],
        tags: ["women", "sets", "knit"],
        attributes: { color: "Sand", size: "S" },
        variants: [{ name: "Size", value: "S", stock: 9, sku: "SET-SAND-S" }],
        stock: 9,
        featured: false,
      },
    ],
  },
  {
    slug: "trending-now",
    name: "Trending Now",
    description: "Fresh favorites with a polished edge, styled for the season’s most-loved looks.",
    featured: true,
    homeTheme: "purple",
    products: [
      {
        title: "Glossy Pleat Skirt",
        slug: "glossy-pleat-skirt",
        description: "A sharp pleated silhouette with an easy swing and standout finish.",
        price: 2100000,
        images: [],
        tags: ["women", "trending", "skirts"],
        attributes: { color: "Black", size: "M" },
        variants: [{ name: "Size", value: "M", stock: 8, sku: "SKIRT-BLK-M" }],
        stock: 8,
        featured: true,
      },
      {
        title: "Lounge Street Tee",
        slug: "lounge-street-tee",
        description: "A lightweight tee with an oversized fit and easy street-ready styling.",
        price: 1200000,
        images: [],
        tags: ["men", "unisex", "tops"],
        attributes: { color: "Charcoal", size: "L" },
        variants: [{ name: "Size", value: "L", stock: 13, sku: "TEE-CHAR-L" }],
        stock: 13,
        featured: true,
      },
      {
        title: "Layered Utility Jacket",
        slug: "layered-utility-jacket",
        description: "Clean lines and practical storage make this jacket an easy staple.",
        price: 2800000,
        images: [],
        tags: ["men", "jackets", "utility"],
        attributes: { color: "Olive", size: "M" },
        variants: [{ name: "Size", value: "M", stock: 7, sku: "JACKET-OLIVE-M" }],
        stock: 7,
        featured: false,
      },
    ],
  },
  {
    slug: "bold-vibrant",
    name: "Bold & Vibrant",
    description: "Color-driven moments for shoppers who love saturated shades and expressive layers.",
    featured: true,
    homeTheme: "rose",
    products: [
      {
        title: "Flare Colour Pop Dress",
        slug: "flare-colour-pop-dress",
        description: "A statement dress with bright energy and an effortless drape.",
        price: 2550000,
        images: [],
        tags: ["women", "dresses", "bold"],
        attributes: { color: "Coral", size: "S" },
        variants: [{ name: "Size", value: "S", stock: 6, sku: "DRESS-CORAL-S" }],
        stock: 6,
        featured: true,
      },
      {
        title: "Vivid Striped Shirt",
        slug: "vivid-striped-shirt",
        description: "Color-blocked stripes with a relaxed cut and instant impact.",
        price: 1500000,
        images: [],
        tags: ["men", "shirt", "vibrant"],
        attributes: { color: "Red", size: "M" },
        variants: [{ name: "Size", value: "M", stock: 10, sku: "SHIRT-RED-M" }],
        stock: 10,
        featured: true,
      },
      {
        title: "Joy Drop Crossbody",
        slug: "joy-drop-crossbody",
        description: "A compact, polished bag in a bright finish made to stand out.",
        price: 1700000,
        images: [],
        tags: ["bags", "unisex", "gift"],
        attributes: { color: "Cyan", size: "One Size" },
        variants: [{ name: "Size", value: "One Size", stock: 15, sku: "BAG-CYAN-OS" }],
        stock: 15,
        featured: false,
      },
    ],
  },
  {
    slug: "just-dropped",
    name: "Just Dropped",
    description: "New arrivals taking inspiration from fresh tailoring, soft structure, and on-trend layering.",
    featured: true,
    homeTheme: "gold",
    products: [
      {
        title: "Moonlight Knit Polo",
        slug: "moonlight-knit-polo",
        description: "Clean neckline, textured knit, and a refined silhouette for easy styling.",
        price: 2000000,
        images: [],
        tags: ["men", "tops", "new"],
        attributes: { color: "Taupe", size: "L" },
        variants: [{ name: "Size", value: "L", stock: 9, sku: "POLO-TAUPE-L" }],
        stock: 9,
        featured: true,
      },
      {
        title: "Soft Pleat Dress",
        slug: "soft-pleat-dress",
        description: "A crisp dress with movement and a polished finish for day or night.",
        price: 2450000,
        images: [],
        tags: ["women", "dresses", "new"],
        attributes: { color: "Ecru", size: "M" },
        variants: [{ name: "Size", value: "M", stock: 7, sku: "DRESS-ECRU-M" }],
        stock: 7,
        featured: true,
      },
      {
        title: "Minimal Chain Jewellery",
        slug: "minimal-chain-jewellery",
        description: "Fine layering essentials that complete a look without overdoing it.",
        price: 1150000,
        images: [],
        tags: ["jewellery", "gift", "new"],
        attributes: { color: "Gold", size: "One Size" },
        variants: [{ name: "Size", value: "One Size", stock: 20, sku: "JEWELRY-GOLD-OS" }],
        stock: 20,
        featured: false,
      },
    ],
  },
  {
    slug: "gift-ideas",
    name: "Gift Ideas",
    description: "Instantly thoughtful pieces made to delight, from statement accessories to everyday staples.",
    featured: true,
    homeTheme: "slate",
    products: [
      {
        title: "Giftable Mini Tote",
        slug: "giftable-mini-tote",
        description: "A cheerful compact tote designed for gifting and daily carry.",
        price: 1950000,
        images: [],
        tags: ["bags", "gift", "women"],
        attributes: { color: "Rose", size: "One Size" },
        variants: [{ name: "Size", value: "One Size", stock: 11, sku: "TOTE-ROSE-OS" }],
        stock: 11,
        featured: true,
      },
      {
        title: "Charm Jewellery Set",
        slug: "charm-jewellery-set",
        description: "A curated pairing of earrings and necklace in a gifting-ready finish.",
        price: 2100000,
        images: [],
        tags: ["jewellery", "gift", "women"],
        attributes: { color: "Gold", size: "One Size" },
        variants: [{ name: "Size", value: "One Size", stock: 13, sku: "JEWELRY-SET-GOLD-OS" }],
        stock: 13,
        featured: true,
      },
      {
        title: "Kids Story Tee",
        slug: "kids-story-tee",
        description: "A soft, playful tee in a happy wash that makes gifting effortless.",
        price: 950000,
        images: [],
        tags: ["kids", "gift", "tops"],
        attributes: { color: "Sky Blue", size: "6-7Y" },
        variants: [{ name: "Size", value: "6-7Y", stock: 16, sku: "TEE-KIDS-SKY-6Y" }],
        stock: 16,
        featured: false,
      },
    ],
  },
];

const genderCategories: SeedCategory[] = [
  {
    slug: "women",
    name: "Women",
    description: "Modern staples, soft silhouettes, and confident everyday essentials.",
    homeTheme: "rose",
    filters: [{ key: "color", label: "Color", options: ["Black", "Ivory", "Rose", "Taupe"] }],
    products: [
      {
        title: "Refined Ribbed Dress",
        slug: "refined-ribbed-dress",
        description: "A streamlined knit dress with comfort and shape in equal measure.",
        price: 2350000,
        images: [],
        tags: ["women", "dresses"],
        attributes: { color: "Taupe", size: "M" },
        variants: [{ name: "Size", value: "M", stock: 8, sku: "DRESS-RIBBED-TAUPE-M" }],
        stock: 8,
        featured: true,
      },
      {
        title: "Weekend Leather Bag",
        slug: "weekend-leather-bag",
        description: "A polished carryall for commute days, city walks, and weekend plans.",
        price: 2800000,
        images: [],
        tags: ["women", "bags"],
        attributes: { color: "Black", size: "One Size" },
        variants: [{ name: "Size", value: "One Size", stock: 11, sku: "BAG-LEATHER-BLK-OS" }],
        stock: 11,
        featured: false,
      },
    ],
    subcategories: [
      "Dresses",
      "Tops",
      "Trousers",
      "Skirts",
      "Sets",
      "Jackets",
      "Bags",
      "Shoes",
      "Jewellery",
    ],
  },
  {
    slug: "men",
    name: "Men",
    description: "Clean essentials built for everyday wear, layering, and easy confidence.",
    homeTheme: "slate",
    filters: [{ key: "color", label: "Color", options: ["Black", "Stone", "Olive", "Navy"] }],
    products: [
      {
        title: "Tailored Urban Shirt",
        slug: "tailored-urban-shirt",
        description: "A refined shirt with a relaxed cut and weighty drape for daily layering.",
        price: 1800000,
        images: [],
        tags: ["men", "shirt"],
        attributes: { color: "Navy", size: "M" },
        variants: [{ name: "Size", value: "M", stock: 12, sku: "SHIRT-URBAN-NAVY-M" }],
        stock: 12,
        featured: true,
      },
      {
        title: "Everyday Denim Short",
        slug: "everyday-denim-short",
        description: "Easy denim shorts cut for warm weather comfort and city movement.",
        price: 1750000,
        images: [],
        tags: ["men", "shorts"],
        attributes: { color: "Stone", size: "L" },
        variants: [{ name: "Size", value: "L", stock: 9, sku: "SHORTS-DENIM-STONE-L" }],
        stock: 9,
        featured: false,
      },
    ],
    subcategories: [
      "shirt",
      "shorts",
      "underwear",
      "Tops",
      "Jackets",
      "Shoes",
      "Bags",
    ],
  },
  {
    slug: "unisex",
    name: "Unisex",
    description: "Versatile pieces designed to move effortlessly between day and night.",
    homeTheme: "purple",
    filters: [{ key: "color", label: "Color", options: ["Sand", "Chocolate", "Forest", "Mustard"] }],
    products: [
      {
        title: "Canvas Utility Tote",
        slug: "canvas-utility-tote",
        description: "Roomy everyday carry with a playful structure and versatile palette.",
        price: 1700000,
        images: [],
        tags: ["unisex", "bags"],
        attributes: { color: "Sand", size: "One Size" },
        variants: [{ name: "Size", value: "One Size", stock: 14, sku: "TOTE-CANVAS-SAND-OS" }],
        stock: 14,
        featured: true,
      },
      {
        title: "City Zip Hoodie",
        slug: "city-zip-hoodie",
        description: "A soft, easy hoodie with a relaxed fit that settles into daily wear.",
        price: 2200000,
        images: [],
        tags: ["unisex", "tops"],
        attributes: { color: "Chocolate", size: "L" },
        variants: [{ name: "Size", value: "L", stock: 10, sku: "HOODIE-CHOCO-L" }],
        stock: 10,
        featured: false,
      },
    ],
    subcategories: ["Tops", "Bags", "Shoes", "Jackets", "Sets"],
  },
  {
    slug: "kids",
    name: "Kids",
    description: "Playful, easy pieces for growing routines, school days, and active weekends.",
    homeTheme: "emerald",
    filters: [{ key: "color", label: "Color", options: ["Sky Blue", "Mint", "Sunset", "Lilac"] }],
    products: [
      {
        title: "Playtime Graphic Tee",
        slug: "playtime-graphic-tee",
        description: "A soft tee for playtime, school runs, and easy layering.",
        price: 950000,
        images: [],
        tags: ["kids", "tops"],
        attributes: { color: "Sky Blue", size: "6-7Y" },
        variants: [{ name: "Size", value: "6-7Y", stock: 18, sku: "TEE-KIDS-SKY-7Y" }],
        stock: 18,
        featured: true,
      },
      {
        title: "Sunny Mini Backpack",
        slug: "sunny-mini-backpack",
        description: "A compact carryall designed for school bags, treats, and little essentials.",
        price: 1500000,
        images: [],
        tags: ["kids", "bags"],
        attributes: { color: "Mint", size: "One Size" },
        variants: [{ name: "Size", value: "One Size", stock: 12, sku: "BAG-KIDS-MINT-OS" }],
        stock: 12,
        featured: false,
      },
    ],
    subcategories: ["Tops", "shorts", "Sets", "Shoes", "Bags"],
  },
  {
    slug: "girls",
    name: "Girls",
    description: "Sweet silhouettes and bright details made for everyday confidence and play.",
    homeTheme: "rose",
    filters: [{ key: "color", label: "Color", options: ["Pink", "Lilac", "White", "Lavender"] }],
    products: [
      {
        title: "Petal Kiko Dress",
        slug: "petal-kiko-dress",
        description: "A light, playful dress with soft structure and easy movement.",
        price: 2100000,
        images: [],
        tags: ["girls", "dresses"],
        attributes: { color: "Pink", size: "6-7Y" },
        variants: [{ name: "Size", value: "6-7Y", stock: 8, sku: "DRESS-GIRLS-PINK-7Y" }],
        stock: 8,
        featured: true,
      },
      {
        title: "Bloom Pleat Skirt",
        slug: "bloom-pleat-skirt",
        description: "A twirl-ready skirt styled for easy play, movement, and everyday wear.",
        price: 1700000,
        images: [],
        tags: ["girls", "skirts"],
        attributes: { color: "Lilac", size: "7-8Y" },
        variants: [{ name: "Size", value: "7-8Y", stock: 7, sku: "SKIRT-GIRLS-LILAC-8Y" }],
        stock: 7,
        featured: false,
      },
    ],
    subcategories: ["Dresses", "Tops", "Skirts", "Sets", "Shoes"],
  },
  {
    slug: "boys",
    name: "Boys",
    description: "Comfort-first essentials for active days, relaxed weekends, and school-ready styling.",
    homeTheme: "gold",
    filters: [{ key: "color", label: "Color", options: ["Blue", "Forest", "Sand", "Black"] }],
    products: [
      {
        title: "Active Sport Tee",
        slug: "active-sport-tee",
        description: "A soft everyday tee built for all-day comfort and lightweight movement.",
        price: 1000000,
        images: [],
        tags: ["boys", "tops"],
        attributes: { color: "Blue", size: "8-9Y" },
        variants: [{ name: "Size", value: "8-9Y", stock: 15, sku: "TEE-BOYS-BLUE-9Y" }],
        stock: 15,
        featured: true,
      },
      {
        title: "Trail Utility Shorts",
        slug: "trail-utility-shorts",
        description: "A durable short for active days and easy weekend outings.",
        price: 1600000,
        images: [],
        tags: ["boys", "shorts"],
        attributes: { color: "Forest", size: "8-9Y" },
        variants: [{ name: "Size", value: "8-9Y", stock: 10, sku: "SHORTS-BOYS-FOR-9Y" }],
        stock: 10,
        featured: false,
      },
    ],
    subcategories: ["shirt", "shorts", "Tops", "Jackets", "Shoes"],
  },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MONGODB_URI before seeding");

  await mongoose.connect(uri);

  const allCategorySeeds = genderCategories;
  let totalProducts = 0;

  for (const [index, categorySeed] of allCategorySeeds.entries()) {
    const category = await Category.findOneAndUpdate(
      { slug: categorySeed.slug },
      {
        name: categorySeed.name,
        slug: categorySeed.slug,
        description: categorySeed.description,
        featured: categorySeed.featured ?? false,
        filters: categorySeed.filters ?? [
          { key: "color", label: "Color", options: ["Black", "White", "Sand", "Ivory"] },
          { key: "size", label: "Size", options: ["XS", "S", "M", "L"] },
        ],
        showOnHome: true,
        homeOrder: index + 1,
        homeTheme: categorySeed.homeTheme ?? "purple",
        homeDisplayMode: "grid",
      },
      { upsert: true, new: true }
    );

    for (const childName of categorySeed.subcategories ?? []) {
      const childSlug = `${category.slug}-${childName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
      await Category.findOneAndUpdate(
        { slug: childSlug },
        {
          name: childName,
          slug: childSlug,
          description: `Shop ${category.name} ${childName.toLowerCase()}.`,
          parent: category._id,
          filters: [{ key: "color", label: "Color", options: ["Black", "White", "Sand", "Ivory"] }],
          showOnHome: false,
          homeOrder: 100,
        },
        { upsert: true, new: true }
      );
    }

    for (const product of categorySeed.products ?? []) {
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

    console.log(`Seeded category "${category.name}" with ${(categorySeed.products ?? []).length} products.`);
  }

  const unisexCategory = await Category.findOne({ slug: "unisex" });
  if (!unisexCategory) throw new Error("The Unisex category is required before seeding collections");

  for (const [index, collectionSeed] of topLevelCollections.entries()) {
    const collection = await Collection.findOneAndUpdate(
      { slug: collectionSeed.slug },
      {
        title: collectionSeed.name,
        slug: collectionSeed.slug,
        description: collectionSeed.description,
        showOnHome: true,
        homeOrder: index + 1,
        homeTheme: collectionSeed.homeTheme ?? "purple",
        homeDisplayMode: "grid",
      },
      { upsert: true, new: true }
    );

    for (const product of collectionSeed.products ?? []) {
      await Product.findOneAndUpdate(
        { slug: product.slug },
        {
          ...product,
          category: unisexCategory._id,
          collections: [collection._id],
          currency: "NGN",
          reviewsEnabled: true,
        },
        { upsert: true, new: true }
      );
      totalProducts += 1;
    }

    console.log(`Seeded collection "${collection.title}" with ${(collectionSeed.products ?? []).length} products.`);
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

  console.log(`Finished seeding ${totalProducts} products across ${allCategorySeeds.length} categories.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
