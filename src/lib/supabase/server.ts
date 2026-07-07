// CONCEPT: @supabase/ssr is the officially recommended package for Supabase
// Auth in Next.js App Router. createServerClient takes a cookie adapter that
// uses the cookies() API from next/headers for Server Components.
// WHY: The getAll/setAll cookie pattern handles both reading and writing auth
// cookies. Server Components have a read-only cookie context, so we wrap
// setAll in a try/catch to silently handle the read-only case.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // `set` throws in read-only Server Component contexts.
            // Auth cookies are still readable via getAll.
          }
        },
      },
    }
  );
}
