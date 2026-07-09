"use client";

// CONCEPT: This page displays the results of a completed quiz attempt.
// It shows the user's score, time taken, improvement vs previous attempts,
// and a full review of every question with correct/incorrect answers and
// explanations.
//
// WHY: This is a Client Component because it fetches attempt results from
// the tRPC API and handles expandable explanation cards client-side.
import { useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  BookOpen,
  Loader2,
} from "lucide-react";

function QuizResultsPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = Number(params.id);
  const attemptId = Number(params.attemptId);

  // ── Fetch results ───────────────────────────────────────────────
  const { data: results, isLoading, error } = api.quiz.getAttemptResults.useQuery(
    { attemptId },
    { enabled: !isNaN(attemptId) }
  );

  // ── State for expandable explanations ────────────────────────────
  const [expandedExplanations, setExpandedExplanations] = useState<
    Record<number, boolean>
  >({});

  const toggleExplanation = (questionId: number) => {
    setExpandedExplanations((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // ── Loader state ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────
  if (error || !results) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          Results not found
        </p>
        <p className="text-sm text-zinc-500">
          {error?.message ?? "This attempt may have been deleted."}
        </p>
        <Link href={`/dashboard/quizzes/${quizId}/attempt`}>
          <Button variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Retry Quiz
          </Button>
        </Link>
      </div>
    );
  }

  const totalQuestions = results.maxPossibleScore ?? results.quiz?.totalQuestions ?? 0;
  const score = results.totalScore ?? 0;
  const percentage = results.percentageScore ? Number(results.percentageScore) : 0;
  const improvement = results.improvement;

  // Color code score
  const scoreColor =
    percentage >= 80
      ? "text-emerald-600"
      : percentage >= 60
        ? "text-amber-600"
        : "text-red-600";

  const scoreBg =
    percentage >= 80
      ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800"
      : percentage >= 60
        ? "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800"
        : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800";

  // Format time
  const formatTime = (seconds: number | null): string => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const rm = m % 60;
      return `${h}h ${rm}m ${s}s`;
    }
    return `${m}m ${s}s`;
  };

  // Split responses into a map by questionId for easy lookup
  const responseMap = new Map(
    results.responses?.map((r) => [r.questionId, r]) ?? []
  );

  // Build the question list from the attempt's quiz or responses
  const questions = results.quiz?.quizQuestions ?? [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* ── Back button ───────────────────────────────────────── */}
        <Link
          href={`/dashboard/quizzes/${quizId}/attempt`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 min-h-[44px] min-w-[44px]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retry Quiz
        </Link>

        {/* ── Score header ──────────────────────────────────────── */}
        <div className={`mb-8 rounded-lg border p-6 text-center ${scoreBg}`}>
          {/* Circular score display */}
          <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full border-4 border-current">
            <div>
              <div className={`text-3xl font-bold ${scoreColor}`}>
                {score}/{totalQuestions}
              </div>
              <div className={`text-lg font-semibold ${scoreColor}`}>
                {percentage}%
              </div>
            </div>
          </div>

          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {results.quiz?.quizName ?? "Quiz"} — Complete!
          </h1>

          {/* Time taken */}
          <div className="mt-2 flex items-center justify-center gap-1.5 text-sm text-zinc-500">
            <Clock className="h-4 w-4" />
            Completed in {formatTime(results.timeSpent ?? null)}
          </div>

          {/* Improvement vs previous attempt */}
          {improvement !== null && (
            <div className="mt-2 flex items-center justify-center gap-1 text-sm font-medium">
              {improvement >= 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-emerald-600">
                    ↑ {improvement}% from last attempt
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-red-600">
                    ↓ {Math.abs(improvement)}% from last attempt
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Question review list ───────────────────────────────── */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Question Review
          </h2>

          {questions.map((qq: any, index: number) => {
            const response = responseMap.get(qq.questionId);
            const isCorrect = response?.isCorrect;
            const question = qq.question;
            const correctOption = question?.options?.find((o: any) => o.isCorrect);
            const selectedOptionId = response?.selectedOptionId;
            const userOption = question?.options?.find(
              (o: any) => o.id === selectedOptionId
            );

            return (
              <div
                key={qq.questionId}
                className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Question text and verdict */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-zinc-400">
                        Q{index + 1}
                      </span>
                      {isCorrect ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                          Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                          Incorrect
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {question?.questionText}
                    </p>

                    {/* User's answer */}
                    <div className="mt-2 text-xs">
                      <span className="text-zinc-500">Your answer: </span>
                      <span
                        className={
                          isCorrect
                            ? "font-medium text-emerald-600"
                            : "font-medium text-red-600"
                        }
                      >
                        {userOption?.optionText ?? "Not answered"}
                      </span>
                    </div>

                    {/* Correct answer (only if wrong) */}
                    {!isCorrect && correctOption && (
                      <div className="mt-0.5 text-xs">
                        <span className="text-zinc-500">Correct answer: </span>
                        <span className="font-medium text-emerald-600">
                          {correctOption.optionText}
                        </span>
                      </div>
                    )}

                    {/* Time spent on question */}
                    {response?.responseTime != null && (
                      <div className="mt-0.5 text-xs text-zinc-400">
                        {response.responseTime}s spent
                      </div>
                    )}
                  </div>

                  {/* Expand explanation button */}
                  <button
                    onClick={() => toggleExplanation(qq.questionId)}
                    className="shrink-0 p-1 text-zinc-400 hover:text-zinc-600 min-h-[44px] min-w-[44px]"
                  >
                    {expandedExplanations[qq.questionId] ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Expandable explanation */}
                {expandedExplanations[qq.questionId] && question?.explanation && (
                  <div className="mt-3 rounded-md bg-blue-50 p-3 text-sm leading-relaxed text-zinc-700 dark:bg-blue-950 dark:text-zinc-300">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                      Explanation
                    </p>
                    {question.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Action buttons ─────────────────────────────────────── */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={`/dashboard/quizzes/${quizId}/attempt`} className="flex-1">
            <Button className="w-full gap-2 min-h-[44px]">
              <RotateCcw className="h-4 w-4" />
              Retry Quiz
            </Button>
          </Link>

          <Link href="/dashboard/quizzes" className="flex-1">
            <Button variant="outline" className="w-full gap-2 min-h-[44px]">
              <BookOpen className="h-4 w-4" />
              All Quizzes
            </Button>
          </Link>

          <Link href="/dashboard/questions" className="flex-1">
            <Button variant="outline" className="w-full gap-2 min-h-[44px]">
              <BookOpen className="h-4 w-4" />
              Question Bank
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function QuizResultsPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    }>
      <QuizResultsPage />
    </Suspense>
  );
}
