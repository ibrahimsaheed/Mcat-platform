// CONCEPT: Next.js middleware runs on every request BEFORE it reaches the
// page/route handler. We use it to refresh the Supabase Auth session on every
// request (preventing session expiry) and to protect routes by redirecting
// unauthenticated users away from /dashboard.
// WHY: The session refresh is essential because Supabase access tokens expire
// after 1 hour. The middleware silently refreshes them so the user stays
// logged in without noticing.
//
// We use createServerClient from @supabase/ssr with request/response cookies
// because @supabase/ssr is the officially recommended package for App Router.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Build a response early so we can set cookies on it.
  let response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next();
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — this is a no-op if the token is still valid, but
  // transparently exchanges a refresh token if the access token has expired.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // ── Protected routes ─────────────────────────────────────────────────
  // Any route starting with /dashboard requires an active session.
  if (pathname.startsWith("/dashboard") && !session) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // ── Auth pages — redirect logged-in users away ──────────────────────
  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

// Only run middleware on these paths — everything else passes through.
export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
