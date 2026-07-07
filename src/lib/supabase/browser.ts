// CONCEPT: createBrowserClient from @supabase/ssr is for Client Components.
// It reads auth session cookies (set by the server) and handles automatic
// token refresh in the browser.
// WHY: Client Components can't use next/headers, so this client relies on
// HTTP-only cookies that the middleware and server set during auth flows.
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
