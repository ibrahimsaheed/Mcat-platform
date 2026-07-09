// WHY: Redesigned dashboard home with Apple-inspired clean minimalism.
// It's a Server Component that fetches all data (user, stats, counts) server-side
// so the page renders instantly. No client-side loading states needed.
//
// CONCEPT: The time-based greeting is determined server-side from the server's
// current hour. Since this is a Server Component, the user sees the correct
// greeting immediately without a hydration flash.
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  BookOpen,
  ClipboardList,
  BarChart3,
  Calendar,
  Stethoscope,
  GraduationCap,
  ChevronRight,
} from "lucide-react";

// ── Time-based greeting helper ─────────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// ── Feature card type ──────────────────────────────────────────────
interface FeatureCard {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href?: string;
  soon?: boolean;
}

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch live counts from the database.
  // WHY: We look up the Prisma user by supabaseId because the Supabase Auth
  // user ID is a UUID string, while the Prisma User.id is an auto-increment
  // integer. The join table userQuizAttempt references the Prisma user.id.
  const prismaUser = user
    ? await prisma.user.findUnique({ where: { supabaseId: user.id } })
    : null;

  const [totalQuestions, totalQuizzes, totalUserAttempts] = await Promise.all([
    prisma.question.count({ where: { isActive: true } }),
    prisma.quiz.count({ where: { isActive: true } }),
    prismaUser
      ? prisma.userQuizAttempt.count({ where: { userId: prismaUser.id } })
      : Promise.resolve(0),
  ]);

  // Extract first name from email for a personalized greeting
  const firstName = user?.email?.split("@")[0] ?? "there";

  // ── Feature cards ──────────────────────────────────────────────
  const cards: FeatureCard[] = [
    {
      icon: <BookOpen className="h-7 w-7" />,
      title: "Question Bank",
      subtitle: "Browse and practice 25 MCAT questions",
      href: "/dashboard/questions",
    },
    {
      icon: <ClipboardList className="h-7 w-7" />,
      title: "Quizzes",
      subtitle: "Take timed quizzes and track your score",
      href: "/dashboard/quizzes",
    },
    {
      icon: <BarChart3 className="h-7 w-7" />,
      title: "Analytics",
      subtitle: "Track your progress and weak areas",
      soon: true,
    },
    {
      icon: <Calendar className="h-7 w-7" />,
      title: "Study Plan",
      subtitle: "Schedule your MCAT prep day by day",
      soon: true,
    },
    {
      icon: <Stethoscope className="h-7 w-7" />,
      title: "Pre-Med Profile",
      subtitle: "Log clinical hours, research, and activities",
      soon: true,
    },
    {
      icon: <GraduationCap className="h-7 w-7" />,
      title: "Med School Tracker",
      subtitle: "Track applications and personal statements",
      soon: true,
    },
  ];

  return (
    <>
      {/* ── Hero section ──────────────────────────────────────────── */}
      <section className="mt-4 sm:mt-8">
        <h1 className="text-[32px] font-semibold leading-tight text-[#1D1D1F] sm:text-5xl">
          {getGreeting()}, {firstName}.
        </h1>
        <p className="mt-2 text-lg text-[#6E6E73]">
          Your MCAT journey continues.
        </p>
      </section>

      {/* ── Stats strip ───────────────────────────────────────────── */}
      <section className="mt-12">
        <div className="grid grid-cols-3 gap-4">
          <StatCard value={totalQuestions} label="Questions" />
          <StatCard value={totalQuizzes} label="Quizzes" />
          <StatCard value={totalUserAttempts} label="Attempts" />
        </div>
      </section>

      {/* ── Feature cards grid ────────────────────────────────────── */}
      <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) =>
          card.href && !card.soon ? (
            <Link
              key={card.title}
              href={card.href}
              className="group relative flex flex-col rounded-2xl bg-[#F5F5F7] p-6 shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <div className="text-[#0A84FF]">{card.icon}</div>
              <h3 className="mt-4 text-xl font-semibold text-[#1D1D1F]">
                {card.title}
              </h3>
              <p className="mt-1 text-sm text-[#6E6E73]">{card.subtitle}</p>
              <ChevronRight className="absolute bottom-6 right-6 h-5 w-5 text-[#6E6E73] transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <div
              key={card.title}
              className="relative flex flex-col rounded-2xl bg-[#FAFAFA] p-6"
            >
              {/* "Soon" badge */}
              <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs font-medium text-[#0A84FF] ring-1 ring-[#D2D2D7]">
                Soon
              </span>
              <div className="text-[#6E6E73]">{card.icon}</div>
              <h3 className="mt-4 text-xl font-semibold text-[#6E6E73]">
                {card.title}
              </h3>
              <p className="mt-1 text-sm text-[#6E6E73]">{card.subtitle}</p>
            </div>
          )
        )}
      </section>
    </>
  );
}

// ── Stat card sub-component ────────────────────────────────────────
function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-[#0A84FF] sm:text-4xl">
        {value}
      </div>
      <div className="mt-0.5 text-sm text-[#6E6E73]">{label}</div>
    </div>
  );
}
