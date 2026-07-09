"use client";

// WHY: This is a Client Component because the sign-out action calls
// supabase.auth.signOut() which runs in the browser.
//
// CONCEPT: The nav shows the user's email on desktop (truncated if long)
// and a sign-out button. On mobile, the email hides and only the sign-out
// icon remains to save horizontal space on small screens.
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { LogOut } from "lucide-react";

interface DashboardNavProps {
  userEmail: string;
}

export function DashboardNav({ userEmail }: DashboardNavProps) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex items-center gap-3">
      {/* User email — hidden on mobile, shown on sm+ */}
      <span className="hidden truncate text-sm text-[#6E6E73] sm:block max-w-[180px] lg:max-w-[240px]">
        {userEmail}
      </span>

      {/* Sign out — icon on mobile, text on desktop */}
      <button
        onClick={handleSignOut}
        className="inline-flex items-center justify-center text-[#6E6E73] hover:text-[#1D1D1F] transition-colors min-h-[44px] min-w-[44px]"
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4 sm:mr-1.5" />
        <span className="hidden sm:inline text-sm">Sign out</span>
      </button>
    </div>
  );
}
