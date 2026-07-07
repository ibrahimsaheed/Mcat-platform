import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "@/lib/trpc/server";
import { prisma } from "@/lib/prisma";

/**
 * Auth router — procedures for checking session state and fetching the
 * current user's profile from the database.
 */
export const authRouter = router({
  /**
   * getSession — returns the current Supabase Auth user or null.
   *
   * WHY: This is a publicProcedure because it just reads ctx.user which is
   * already set (or null) during context creation. No auth required.
   * The frontend calls this on mount to determine which UI to show.
   */
  getSession: publicProcedure.query(async ({ ctx }) => {
    // ctx.user is the Supabase Auth user object (id, email, etc.)
    // or null if the request has no valid JWT.
    return { user: ctx.user };
  }),

  /**
   * getProfile — fetches the full Prisma User record for the current user.
   *
   * WHY: This is a protectedProcedure because it only makes sense for
   * authenticated users. The middleware runs first — if ctx.user is null,
   * it throws UNAUTHORIZED before this code executes.
   *
   * We query by supabaseId because that's the foreign key linking Supabase
   * Auth to our users table. If the row doesn't exist (e.g., user signed up
   * but the callback hasn't synced them yet), we throw NOT_FOUND.
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const profile = await prisma.user.findUnique({
      where: { supabaseId: ctx.user.id },
    });

    if (!profile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message:
          "User profile not found. This may happen if the auth callback hasn't synced your account yet.",
      });
    }

    return profile;
  }),
});

export type AuthRouter = typeof authRouter;
