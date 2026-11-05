import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type IReview = Prisma.ReviewGetPayload<{}>;

export const Review = prisma.review;
