import { publicProcedure, router } from "@/lib/trpc/server";
import { prisma } from "@/lib/prisma";

/**
 * Health-check router — groups procedures that verify the system is alive.
 * Each procedure checks one layer (tRPC, database, etc.) independently.
 */
export const healthRouter = router({
  /**
   * Ping — confirms the tRPC layer responds at all.
   */
  ping: publicProcedure.query(async () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "mcat-platform",
    };
  }),

  /**
   * dbCheck — confirms the Prisma → PostgreSQL connection is live.
   *
   * Runs a trivial `SELECT COUNT(*)` against the users table.
   * If the database is unreachable or the schema is missing, this
   * throws, which tRPC catches and returns as an error response.
   */
  dbCheck: publicProcedure.query(async () => {
    const userCount = await prisma.user.count();
    return { ok: true, userCount };
  }),
});

export type HealthRouter = typeof healthRouter;
