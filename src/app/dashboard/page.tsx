// WHY: This is a Server Component that fetches the authenticated user and the
// total question count server-side, then renders the dashboard welcome card
// alongside navigation links (including the new Question Bank link).
//
// CONCEPT: We use Supabase Auth's getUser() for auth verification and Prisma
// for the question count. Both run server-side so the user sees content
// immediately without client-side loading states.
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "./sign-out-button";
import { BookOpen, GraduationCap, ArrowRight, ClipboardList, Zap } from "lucide-react";

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch counts for dashboard cards
  const [totalQuestions, totalQuizzes] = await Promise.all([
    prisma.question.count({ where: { isActive: true } }),
    prisma.quiz.count({ where: { isActive: true } }),
  ]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="mb-2 text-2xl font-bold tracking-tight">
          Welcome, {user.email ?? "User"}
        </h1>
        <p className="mb-6 text-sm text-zinc-500">
          You are signed in to your MCAT Platform account.
        </p>

        {/* ── Question Bank Card ─────────────────────────────────── */}
        <Link
          href="/dashboard/questions"
          className="mb-4 flex items-center gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 min-h-[64px]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Question Bank
            </p>
            <p className="text-xs text-zinc-500">
              {totalQuestions} questions available
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-zinc-400" />
        </Link>

        {/* ── Quizzes Card ──────────────────────────────────────── */}
        <Link
          href="/dashboard/quizzes"
          className="mb-4 flex items-center gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 min-h-[64px]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Timed Quizzes
            </p>
            <p className="text-xs text-zinc-500">
              {totalQuizzes} practice quizzes available
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-zinc-400" />
        </Link>

        {/* ── MCAT Simulator Card (placeholder for future use) ──── */}
        <div className="mb-6 flex items-center gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 opacity-50 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              MCAT Simulator
            </p>
            <p className="text-xs text-zinc-500">
              Coming soon
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
