import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type ICategory = Prisma.CategoryGetPayload<{}>;

export const Category = prisma.category;
