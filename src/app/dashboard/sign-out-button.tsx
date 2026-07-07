// WHY: This must be a Client Component because supabase.auth.signOut() is a
// browser-side operation that clears the auth cookie. A Server Component can't
// run client-side logic.
"use client";

import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

/**
 * Sign-out button — calls supabase.auth.signOut() and redirects to /login.
 *
 * CONCEPT: signOut() destroys the current Supabase session on the client.
 * The middleware then sees no session on the next navigation and redirects
 * to /login. We also call router.push('/login') immediately so the user
 * doesn't see a flash of the dashboard.
 */
export function SignOutButton() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors min-h-[44px] min-w-[44px]"
    >
      Sign Out
    </button>
  );
}
