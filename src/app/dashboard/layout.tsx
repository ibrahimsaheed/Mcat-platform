// CONCEPT: This layout wraps all dashboard pages with a consistent navigation
// bar and structure. It's a Server Component that fetches the user for display
// in the nav, then renders children inside a max-width container.
//
// WHY: Keeping the nav here (not in the root layout) means the login page and
// public pages don't show it. The sticky top nav persists across dashboard
// page transitions because Next.js preserves layouts across child page changes.
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DashboardNav } from "./dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── Top navigation bar ────────────────────────────────────
          Apple-inspired: sticky, backdrop blur, clean white with
          subtle bottom border. 48px on mobile, 56px on desktop. */}
      <header className="sticky top-0 z-50 border-b border-[#D2D2D7] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:h-14 sm:px-6 lg:px-8">
          {/* "Synapse" wordmark in Neonderthaw font */}
          <Link
            href="/dashboard"
            className="text-2xl leading-none font-synapse text-[#1D1D1F] no-underline"
          >
            Synapse
          </Link>

          {/* Right side: user email + sign out */}
          <DashboardNav userEmail={user.email ?? ""} />
        </div>
      </header>

      {/* ── Page content ─────────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
