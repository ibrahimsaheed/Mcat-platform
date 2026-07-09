// WHY: This is a Client Component because @supabase/auth-ui-react's Auth
// component uses browser APIs (cookies, localStorage) internally. It also
// needs access to the browser Supabase client for the sign-in flow.
//
// CONCEPT: Apple-inspired login page with "Synapse" branding in the
// Neonderthaw font. The Auth UI is styled with Apple-blue accent colors
// and rounded inputs/buttons.
"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const supabase = createBrowserSupabaseClient();

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-[400px]">
        {/* ── Synapse branding ───────────────────────────────────── */}
        <div className="mb-8 text-center">
          <h1 className="font-synapse text-[40px] leading-none text-[#1D1D1F]">
            Synapse
          </h1>
          <p className="mt-2 text-base text-[#6E6E73]">
            Your MCAT prep. Organized.
          </p>
        </div>

        {/* ── Auth UI ────────────────────────────────────────────── */}
        {/* CONCEPT: We pass a custom appearance object to the Auth component
            to match the Apple-inspired design system: #0A84FF brand color,
            12px border radius on buttons and inputs, no border on buttons. */}
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "#0A84FF",
                  brandAccent: "#0071E3",
                },
                borderWidths: {
                  buttonBorderWidth: "0px",
                },
                radii: {
                  borderRadiusButton: "12px",
                  inputBorderRadius: "12px",
                },
              },
            },
          }}
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
