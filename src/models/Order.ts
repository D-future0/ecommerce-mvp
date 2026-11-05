import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface IOrderItem {
  product: string;
  title: string;
  image: string;
  variant?: string;
  price: number;
  quantity: number;
}

export type IOrder = Prisma.OrderGetPayload<{}>;

export const Order = prisma.order;
