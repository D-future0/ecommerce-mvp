import type { Prisma } from "@prisma/client";

export interface CategoryFilter {
  key: string;
  label: string;
  options: string[];
}

export function parseCategoryFilters(value: Prisma.JsonValue): CategoryFilter[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (filter): filter is Prisma.JsonObject =>
      typeof filter === "object" &&
      filter !== null &&
      !Array.isArray(filter) &&
      typeof filter.key === "string" &&
      typeof filter.label === "string" &&
      Array.isArray(filter.options) &&
      filter.options.every((option) => typeof option === "string")
  ).map((filter) => ({
    key: filter.key as string,
    label: filter.label as string,
    options: filter.options as string[],
  }));
}
