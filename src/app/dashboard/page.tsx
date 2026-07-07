// WHY: This is a Server Component because we call supabase.auth.getUser()
// server-side using the cookie-based session. No need for client-side
// JavaScript to render the welcome message — faster initial load.
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

/**
 * Dashboard page — protected by middleware, shows the logged-in user's email.
 *
 * CONCEPT: We call getUser() (not getSession()) because getUser() verifies
 * the JWT with Supabase Auth API. The middleware already refreshed the session
 * cookie, so this call is efficient and reliable.
 */
export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Safety check — if the middleware somehow let an unauthenticated request
  // through (e.g., during development), redirect to login.
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="mb-2 text-2xl font-bold tracking-tight">
          Welcome, {user.email ?? "User"}
        </h1>
        <p className="mb-6 text-sm text-zinc-500">
          You are signed in to your MCAT Platform account.
        </p>

        <div className="flex justify-center">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
