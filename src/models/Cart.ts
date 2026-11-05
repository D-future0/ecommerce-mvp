import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export interface ICartItem {
  product: string;
  variant?: string | null;
  quantity: number;
}

export type ICart = Prisma.CartGetPayload<{}>;

export const Cart = prisma.cart;
