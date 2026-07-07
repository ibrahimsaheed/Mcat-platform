// WHY: We use the DIRECT_URL (session mode port 5432) instead of DATABASE_URL
// (pooler/transaction mode port 6543) because the pooler doesn't support
// prepared statements. Prisma uses prepared statements for parameterized
// queries, which fails on the transaction mode pooler with "prepared statement
// does not exist" errors.
//
// CONCEPT: Supabase's connection pooler has two modes:
// - Transaction mode (port 6543): efficient connection pooling but doesn't
//   support prepared statements, session variables, or LISTEN/NOTIFY.
// - Session mode (port 5432): direct connections that support all Postgres
//   features, but fewer total connections. Perfect for Prisma.
//
// We fall back to DATABASE_URL if DIRECT_URL isn't set (e.g., on preview
// deployments that only configure one URL).
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: directUrl,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
