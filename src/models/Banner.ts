import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type IBanner = Prisma.BannerGetPayload<{}>;

export const Banner = prisma.banner;
