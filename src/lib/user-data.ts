import type { Prisma } from "@prisma/client";

export interface UserAddress {
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export type UserBillingAddress = Omit<UserAddress, "isDefault">;

export interface RecentlyViewedEntry {
  product: string;
  viewedAt: string;
}

function isRecord(value: Prisma.JsonValue | undefined): value is Prisma.JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasAddressFields(value: Prisma.JsonValue): value is Prisma.JsonObject {
  return (
    isRecord(value) &&
    typeof value.label === "string" &&
    typeof value.line1 === "string" &&
    typeof value.city === "string" &&
    typeof value.state === "string" &&
    typeof value.country === "string" &&
    typeof value.phone === "string"
  );
}

export function parseUserAddresses(value: Prisma.JsonValue): UserAddress[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (address): address is Prisma.JsonObject =>
      hasAddressFields(address) && typeof address.isDefault === "boolean"
  ).map((address) => ({
    label: address.label as string,
    line1: address.line1 as string,
    ...(typeof address.line2 === "string" ? { line2: address.line2 } : {}),
    city: address.city as string,
    state: address.state as string,
    country: address.country as string,
    phone: address.phone as string,
    isDefault: address.isDefault as boolean,
  }));
}

export function parseBillingAddress(
  value: Prisma.JsonValue | null
): UserBillingAddress | null {
  if (!value || !hasAddressFields(value)) return null;
  return {
    label: value.label as string,
    line1: value.line1 as string,
    ...(typeof value.line2 === "string" ? { line2: value.line2 } : {}),
    city: value.city as string,
    state: value.state as string,
    country: value.country as string,
    phone: value.phone as string,
  };
}

export function parseRecentlyViewed(value: Prisma.JsonValue): RecentlyViewedEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is Prisma.JsonObject =>
      isRecord(entry) &&
      typeof entry.product === "string" &&
      typeof entry.viewedAt === "string"
  ).map((entry) => ({
    product: entry.product as string,
    viewedAt: entry.viewedAt as string,
  }));
}
