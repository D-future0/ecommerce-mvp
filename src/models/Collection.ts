import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type ICollection = Prisma.CollectionGetPayload<{}>;

export const Collection = prisma.collection;
