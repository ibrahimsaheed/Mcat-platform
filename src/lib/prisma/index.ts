import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton — prevents multiple instances during hot-reload.
 *
 * In development, Next.js hot-reload can create many PrismaClient instances.
 * Storing the client on `globalThis` avoids this.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
