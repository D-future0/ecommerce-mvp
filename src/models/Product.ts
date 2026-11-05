import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export interface IProductVariant {
  name: string;
  value: string;
  priceDelta?: number;
  stock: number;
  sku: string;
}

export type IProduct = Prisma.ProductGetPayload<{}>;

export const Product = prisma.product;
