// CONCEPT: This is a Next.js Route Handler (note the file is route.ts, not
// page.tsx). Supabase Auth redirects here after email confirmation or
// magic-link sign-in. We exchange the ?code query param for a real session,
// then sync the Supabase Auth user into our Prisma users table.
//
// WHY: The code exchange must happen server-side because it involves HTTP-only
// cookies that the browser can't read via JavaScript. After exchange, the
// session cookies are set and the user is authenticated on subsequent requests.
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    // No code means someone hit this URL directly — redirect to login.
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = createServerSupabaseClient();

  // Exchange the auth code for a session. This sets the auth cookies
  // on the response via the supabase client's cookie helpers.
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth callback error:", error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  // After exchangeCodeForSession, getSession() returns the active session.
  // We use getUser() here for server-side verification of the JWT.
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (supabaseUser) {
    // ── Sync to Prisma ──────────────────────────────────────────────
    // Check if a user with this Supabase ID already exists in our users table.
    // If not, create one so the Prisma-based features (profiles, analytics, etc.)
    // have a record to work with.
    const existingUser = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!existingUser) {
      // Extract the name parts from email or user_metadata. Supabase sign-up
      // doesn't always include a full name, so we fall back to the email prefix.
      const email = supabaseUser.email ?? "unknown@email.com";
      const firstName =
        supabaseUser.user_metadata?.full_name?.split(" ")[0] ??
        supabaseUser.user_metadata?.name ??
        email.split("@")[0] ??
        "User";

      await prisma.user.create({
        data: {
          supabaseId: supabaseUser.id,
          firstName,
          email,
          passwordHash: "", // Auth is handled by Supabase, not by us
        },
      });

      console.log(`Created Prisma user for Supabase user ${supabaseUser.id}`);
    }
  }

  // Successful session exchange + sync — redirect to the dashboard.
  return NextResponse.redirect(`${origin}${next}`);
}
