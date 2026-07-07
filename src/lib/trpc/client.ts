import { createTRPCReact } from "@trpc/react-query";
import { type AppRouter } from "@/server/routers";

/**
 * tRPC React client — call procedures from client components.
 */
export const api = createTRPCReact<AppRouter>();
