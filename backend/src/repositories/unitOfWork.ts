import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

/** Central place for DB transactions (keeps `prisma` out of domain services). */
export const unitOfWork = {
  run<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return prisma.$transaction(fn);
  },
};
