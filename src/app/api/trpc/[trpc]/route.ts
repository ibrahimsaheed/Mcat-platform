import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";
import { appRouter } from "@/server/routers";
import { createTRPCContext } from "@/server/context";

/**
 * tRPC HTTP handler — mounted at /api/trpc.
 * Supports both GET (queries) and POST (mutations) via the fetch adapter.
 */
const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: ({ req, resHeaders }) =>
      createTRPCContext({ req, resHeaders }),
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC error on "${path ?? "<unknown>"}":`,
              error.message
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };
