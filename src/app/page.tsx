// WHY: The root route redirects visitors to the dashboard if they're logged
// in, or to the login page if they're not. This is a Server Component so
// the redirect happens before any client-side JavaScript loads.
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
