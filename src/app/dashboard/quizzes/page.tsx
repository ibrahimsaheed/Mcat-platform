// WHY: Server Component that pre-fetches all active quizzes from the database
// and renders them as a responsive card grid. The data is fetched server-side
// so the page loads instantly without client-side loading states.
//
// CONCEPT: We use Prisma directly in this Server Component. The quiz list is
// public data (no auth required), but if the user happens to be logged in,
// their attempt counts are included. Since this is a Server Component, we
// defer the auth-specific data to the client-side QuizCard component.
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { QuizCard } from "@/components/quiz/QuizCard";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function QuizzesPage() {
  const quizzes = await prisma.quiz.findMany({
    where: { isActive: true },
    include: {
      category: true,
      _count: { select: { quizQuestions: true } },
    },
    orderBy: { createdDate: "asc" },
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 min-h-[44px] min-w-[44px]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            MCAT Quizzes
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Timed practice sets to test your knowledge across all MCAT subjects.
          </p>
        </div>

        {/* Quiz cards grid */}
        {quizzes.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
              No quizzes available yet
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Head over to the{" "}
              <Link
                href="/dashboard/questions"
                className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Question Bank
              </Link>{" "}
              to practice individual questions in the meantime.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((q) => (
              <QuizCard
                key={q.id}
                id={q.id}
                quizName={q.quizName}
                description={q.description}
                questionCount={q._count.quizQuestions}
                totalPoints={q.totalPoints}
                timeLimit={q.timeLimit ?? 0}
                categoryName={q.category?.categoryName ?? null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
