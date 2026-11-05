import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type IUser = Prisma.UserGetPayload<{}>;

export const User = prisma.user;
