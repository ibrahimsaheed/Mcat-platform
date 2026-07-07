import { router, publicProcedure } from "@/lib/trpc/server";
import { z } from "zod";
import { healthRouter } from "./health.router";
import { authRouter } from "./auth.router";

/**
 * Echo procedure — validates input/output pipeline works.
 */
const echo = publicProcedure
  .input(
    z.object({
      message: z.string().max(500),
    })
  )
  .query(async ({ input }) => {
    return {
      echo: input.message,
      length: input.message.length,
    };
  });

/**
 * Root app router — mount domain routers here as the project grows.
 */
export const appRouter = router({
  health: healthRouter,
  auth: authRouter,
  echo,
});

export type AppRouter = typeof appRouter;
