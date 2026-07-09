// WHY: Server Component that fetches all active quizzes and renders them
// as Apple-inspired cards. The data is fetched server-side so the page
// loads instantly without client-side loading states.
//
// CONCEPT: Cards use the same #F5F5F7 background, rounded-2xl, and
// shadow-sm pattern as the dashboard home page for visual consistency.
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Clock, HelpCircle } from "lucide-react";
import { QuizCard2 } from "@/components/quiz/QuizCard2";

export const dynamic = "force-dynamic";

export default async function QuizzesPage() {
  // Fetch quizzes with category and question count
  const [quizzes, totalQuestions] = await Promise.all([
    prisma.quiz.findMany({
      where: { isActive: true },
      include: {
        category: true,
        _count: { select: { quizQuestions: true } },
      },
      orderBy: { createdDate: "asc" },
    }),
    prisma.question.count({ where: { isActive: true } }),
  ]);

  // Format time limit from seconds to readable string
  function formatTime(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m > 0 ? `${h}h ${m}m` : `${h} hour${h > 1 ? "s" : ""}`;
    }
    return `${minutes} min`;
  }

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#6E6E73] hover:text-[#1D1D1F] transition-colors min-h-[44px] min-w-[44px]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-[32px] font-semibold text-[#1D1D1F] sm:text-4xl">
          Quizzes
        </h1>
        <p className="mt-1 text-[#6E6E73]">
          Timed practice sets to test your knowledge across all MCAT subjects.
        </p>
      </div>

      {/* ── Quick stats bar ──────────────────────────────────────── */}
      <div className="mb-8 flex flex-wrap gap-4 text-sm text-[#6E6E73]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F5F7] px-3 py-1.5">
          <HelpCircle className="h-3.5 w-3.5 text-[#0A84FF]" />
          {quizzes.reduce((sum, q) => sum + q._count.quizQuestions, 0)} total questions
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F5F7] px-3 py-1.5">
          <Clock className="h-3.5 w-3.5 text-[#0A84FF]" />
          {quizzes.length} quizzes available
        </span>
      </div>

      {/* ── Quiz cards grid ──────────────────────────────────────── */}
      {quizzes.length === 0 ? (
        <div className="rounded-2xl bg-[#F5F5F7] p-12 text-center">
          <p className="text-lg font-medium text-[#1D1D1F]">
            No quizzes available yet
          </p>
          <p className="mt-1 text-sm text-[#6E6E73]">
            Head over to the{" "}
            <Link
              href="/dashboard/questions"
              className="font-medium text-[#0A84FF] hover:underline"
            >
              Question Bank
            </Link>{" "}
            to practice individual questions in the meantime.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((q) => (
            <QuizCard2
              key={q.id}
              id={q.id}
              quizName={q.quizName}
              description={q.description}
              questionCount={q._count.quizQuestions}
              totalPoints={q.totalPoints}
              timeLimit={q.timeLimit ?? 0}
              timeLimitFormatted={formatTime(q.timeLimit ?? 0)}
              categoryName={q.category?.categoryName ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
