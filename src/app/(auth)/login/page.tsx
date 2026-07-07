// WHY: This is a Client Component because @supabase/auth-ui-react's Auth
// component uses browser APIs (cookies, localStorage) internally. It also
// needs access to the browser Supabase client for the sign-in flow.
"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

/**
 * Login page — Supabase Auth UI embedded in a centered card.
 *
 * CONCEPT: The Auth component from @supabase/auth-ui-react handles the entire
 * sign-up / sign-in flow (email + password, magic link, OAuth). We configure
 * it with email-only auth and redirect to /auth/callback after confirmation.
 *
 * WHY: We create the Supabase client inline rather than using a hook/context
 * because the Auth component needs it as a prop and we want to keep this page
 * self-contained.
 */
export default function LoginPage() {
  const supabase = createBrowserSupabaseClient();

  return (
    // Centered layout — min-h-screen ensures vertical centering even when
    // content is short. p-4 adds breathing room on small screens.
    <div className="flex min-h-screen items-center justify-center p-4">
      {/* Card container — max-w-sm keeps it readable on desktop (~384px) */}
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="mb-6 text-center text-2xl font-bold tracking-tight">
          MCAT Platform
        </h1>

        <Auth
          supabaseClient={supabase}
          // ThemeSupa is the default Supabase UI theme — clean, responsive,
          // supports dark mode automatically via the appearance.theme.
          appearance={{ theme: ThemeSupa }}
          // Email-only auth for now. OAuth providers can be added later.
          providers={[]}
          redirectTo={
            (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000") +
            "/auth/callback"
          }
        />
      </div>
    </div>
  );
}
