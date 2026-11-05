import type { Prisma } from "@prisma/client";

export interface OrderItemData {
  product: string;
  title: string;
  image: string;
  variant?: string;
  price: number;
  quantity: number;
}

export interface OrderAddressData {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  lga?: string;
}

export function parseOrderItems(value: Prisma.JsonValue): OrderItemData[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Prisma.JsonObject =>
      typeof item === "object" &&
      item !== null &&
      !Array.isArray(item) &&
      typeof item.product === "string" &&
      typeof item.title === "string" &&
      typeof item.image === "string" &&
      typeof item.price === "number" &&
      typeof item.quantity === "number"
  ).map((item) => ({
    product: item.product as string,
    title: item.title as string,
    image: item.image as string,
    ...(typeof item.variant === "string" ? { variant: item.variant } : {}),
    price: item.price as number,
    quantity: item.quantity as number,
  }));
}

export function parseOrderAddress(value: Prisma.JsonValue): OrderAddressData {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  const address = value as Prisma.JsonObject;
  return {
    ...(typeof address.line1 === "string" ? { line1: address.line1 } : {}),
    ...(typeof address.line2 === "string" ? { line2: address.line2 } : {}),
    ...(typeof address.city === "string" ? { city: address.city } : {}),
    ...(typeof address.state === "string" ? { state: address.state } : {}),
    ...(typeof address.country === "string" ? { country: address.country } : {}),
    ...(typeof address.phone === "string" ? { phone: address.phone } : {}),
    ...(typeof address.lga === "string" ? { lga: address.lga } : {}),
  };
}
