import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { type TRPCContext } from "@/server/context";

/**
 * CONCEPT: initTRPC is the factory that creates router and procedure builders
 * bound to a specific context type. Every router/procedure in the app uses
 * these builders so they all share the same context type.
 * WHY: We pass superjson as the transformer so Date objects and other complex
 * types are serialized correctly over the wire.
 */
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

/** Base router builder — all domain routers compose from this. */
export const router = t.router;

/**
 * Public procedure — no auth required.
 * Use this for endpoints that don't need a logged-in user (health checks,
 * login/signup, public content).
 */
export const publicProcedure = t.procedure;

/**
 * WHY: We separate this middleware so every protected procedure doesn't have
 * to repeat the auth check. If ctx.user is null after getUser() verification,
 * the JWT is invalid/missing and we reject immediately with UNAUTHORIZED.
 */
export const protectedProcedure = t.procedure.use(
  async function isAuthed(opts) {
    const { user } = opts.ctx;

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource.",
      });
    }

    // Pass the verified user downstream so procedures don't re-check.
    return opts.next({
      ctx: {
        user,
      },
    });
  }
);

export const middleware = t.middleware;
