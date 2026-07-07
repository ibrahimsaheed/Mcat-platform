// CONCEPT: tRPC context is created once per request and passed to every
// procedure in that request. We use it to inject the authenticated Supabase
// user so procedures don't have to re-fetch it.
// WHY: We call supabase.auth.getUser() here instead of getSession() because
// getUser() verifies the JWT server-side with Supabase Auth API. getSession()
// only reads the cookie, which could be stale or tampered with.
import { inferAsyncReturnType } from "@trpc/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function createTRPCContext(opts: {
  req: Request;
  resHeaders: Headers;
}) {
  const supabase = createServerSupabaseClient();

  // getUser() validates the access token with Supabase Auth.
  // If the token is invalid or expired, user is null — but we don't throw
  // here. Let each procedure decide what to do (public vs protected).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    supabase,
    user, // User | null
    headers: opts.req.headers,
    req: opts.req,
  };
}

export type TRPCContext = inferAsyncReturnType<typeof createTRPCContext>;
