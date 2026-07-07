"use client";

// CONCEPT: This is the single-question practice page — the core learning UI.
// It's a Client Component because it manages answer selection state, bookmark
// toggling, and navigation between questions.
//
// WHY: Users click one of 4 answer options. After selecting, the correct answer
// highlights green, wrong ones red, and the explanation appears. This state
// (which option was selected, whether the answer is locked) is inherently
// client-side — no server rendering needed after the initial load.
//
// The page is designed mobile-first: options stack vertically as large tappable
// buttons (56px min height), and the layout works at 375px width.
import { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bookmark, BookmarkCheck, ChevronRight, Loader2 } from "lucide-react";
import { subjectColors } from "@/components/questions/QuestionFilters";
import type { Question, QuestionCategory, McatTopic, QuestionOption, QuestionTopicMap } from "@prisma/client";

type QuestionWithRelations = Question & {
  options: QuestionOption[];
  category: QuestionCategory | null;
  topicMaps: (QuestionTopicMap & { topic: McatTopic })[];
  passage: unknown;
};

function QuestionPracticePage() {
  const params = useParams();
  const router = useRouter();
  const questionId = Number(params.id);

  // ── Fetch question data ──────────────────────────────────────────
  const { data: question, isLoading, error } = api.question.getById.useQuery(
    { id: questionId },
    { enabled: !isNaN(questionId) }
  );

  // ── State ────────────────────────────────────────────────────────
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  // isLocked becomes true once the user confirms their answer
  const [isLocked, setIsLocked] = useState(false);
  // Bookmark state
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showBookmarkMessage, setShowBookmarkMessage] = useState(false);

  // For the fade-in animation of the explanation
  const explanationRef = useRef<HTMLDivElement>(null);

  // ── Bookmark mutation ────────────────────────────────────────────
  const bookmarkMutation = api.question.toggleBookmark.useMutation({
    onSuccess: (data) => {
      setIsBookmarked(data.bookmarked);
      setShowBookmarkMessage(true);
      setTimeout(() => setShowBookmarkMessage(false), 2000);
    },
    onError: (err) => {
      // If unauthorized, redirect to login
      if (err.data?.code === "UNAUTHORIZED") {
        router.push("/login");
      }
    },
  });

  // ── Find the correct option ──────────────────────────────────────
  const correctOption = question?.options.find((o) => o.isCorrect);
  const selectedOption = question?.options.find((o) => o.id === selectedOptionId);

  // Determine if the user's answer is correct
  const isCorrect = selectedOptionId !== null && selectedOption?.isCorrect === true;

  // ── Subject info for badge ───────────────────────────────────────
  const subject = question?.topicMaps?.[0]?.topic?.subject ?? null;
  const colorClass = subject ? subjectColors[subject] ?? "" : "";

  // ── Handlers ─────────────────────────────────────────────────────

  // Select an option (only if not locked)
  const handleSelectOption = (optionId: number) => {
    if (!isLocked) {
      setSelectedOptionId(optionId);
    }
  };

  // Submit/confirm the answer — locks the selection and shows the explanation
  const handleSubmitAnswer = () => {
    if (selectedOptionId !== null) {
      setIsLocked(true);
    }
  };

  // Toggle bookmark
  const handleToggleBookmark = () => {
    if (question) {
      bookmarkMutation.mutate({ questionId: question.id });
    }
  };

  // ── Loading state ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────
  if (error || !question) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          Question not found
        </p>
        <p className="text-sm text-zinc-500">
          {error?.message ?? "This question may have been removed or is inactive."}
        </p>
        <Link href="/dashboard/questions">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Question Bank
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* ── Top navigation bar ─────────────────────────────────── */}
      <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          {/* Back button */}
          <Link
            href="/dashboard/questions"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 min-h-[44px] min-w-[44px]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>

          {/* Question number and subject badge */}
          <div className="flex items-center gap-3">
            {subject && (
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
              >
                {subject}
              </span>
            )}
            <span className="text-sm text-zinc-500">
              Question #{question.id}
            </span>
          </div>

          {/* Bookmark button */}
          <button
            onClick={handleToggleBookmark}
            disabled={bookmarkMutation.isPending}
            className="relative inline-flex items-center justify-center text-zinc-400 hover:text-amber-500 transition-colors min-h-[44px] min-w-[44px]"
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this question"}
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-5 w-5 fill-amber-500 text-amber-500" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Bookmark toast message */}
        {showBookmarkMessage && (
          <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 rounded-md bg-zinc-900 px-3 py-1.5 text-xs text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900">
            {isBookmarked ? "Bookmarked!" : "Bookmark removed"}
          </div>
        )}
      </div>

      {/* ── Main content ────────────────────────────────────────── */}
      <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
        {/* ── Question text ───────────────────────────────────────── */}
        <h1 className="mb-6 text-lg font-semibold leading-relaxed text-zinc-900 sm:text-xl dark:text-zinc-100">
          {question.questionText}
        </h1>

        {/* ── Answer options ──────────────────────────────────────── */}
        <div className="space-y-3">
          {question.options
            .sort((a, b) => a.optionOrder - b.optionOrder)
            .map((option) => {
              // Determine the visual style based on state
              let optionClasses =
                "flex w-full items-center rounded-lg border px-4 py-4 text-left text-sm leading-relaxed transition-all min-h-[56px]";

              if (isLocked) {
                if (option.isCorrect) {
                  // Correct answer — green highlight
                  optionClasses += " border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500 dark:bg-emerald-950 dark:text-emerald-200";
                } else if (option.id === selectedOptionId) {
                  // Wrong answer that was selected — red highlight
                  optionClasses += " border-red-500 bg-red-50 text-red-900 ring-1 ring-red-500 dark:bg-red-950 dark:text-red-200";
                } else {
                  // Unselected, wrong — dimmed
                  optionClasses += " border-zinc-200 bg-white text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900";
                }
              } else if (option.id === selectedOptionId) {
                // Hovered/pre-selected — blue outline
                optionClasses += " border-blue-500 bg-blue-50 ring-1 ring-blue-500 dark:bg-blue-950 cursor-pointer";
              } else {
                // Default — neutral, clickable
                optionClasses += " border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 cursor-pointer";
              }

              const optionLetter = String.fromCharCode(64 + option.optionOrder); // A, B, C, D

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectOption(option.id)}
                  disabled={isLocked}
                  className={optionClasses}
                >
                  <span className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">
                    {optionLetter}
                  </span>
                  <span className="flex-1">{option.optionText}</span>
                  {/* Check/cross icons when locked */}
                  {isLocked && option.isCorrect && (
                    <svg className="ml-2 h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {isLocked && !option.isCorrect && option.id === selectedOptionId && (
                    <svg className="ml-2 h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              );
            })}
        </div>

        {/* ── Submit button (before answering) ──────────────────── */}
        {!isLocked && (
          <div className="mt-6">
            <Button
              onClick={handleSubmitAnswer}
              disabled={selectedOptionId === null}
              size="lg"
              className="w-full min-h-[56px] text-base sm:w-auto"
            >
              {selectedOptionId === null ? "Select an answer" : "Check Answer"}
            </Button>
          </div>
        )}

        {/* ── Explanation (after answering) ─────────────────────── */}
        {isLocked && (
          <div
            ref={explanationRef}
            className="question-explanation mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950"
          >
            <div className="mb-1 flex items-center gap-2">
              {isCorrect ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                  ✅ Correct
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 dark:bg-red-900 dark:text-red-200">
                  ❌ Incorrect
                </span>
              )}
              <span className="text-xs text-zinc-500">
                Difficulty: {question.difficultyLevel}/5
              </span>
            </div>
            <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Explanation
            </h3>
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {question.explanation}
            </p>
          </div>
        )}

        {/* ── Next Question button ──────────────────────────────── */}
        {isLocked && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/dashboard/questions">
              <Button variant="outline" className="w-full gap-2 sm:w-auto min-h-[44px]">
                <ArrowLeft className="h-4 w-4" />
                Back to Question Bank
              </Button>
            </Link>

            <Link href={`/dashboard/questions/${question.id + 1}`}>
              <Button className="w-full gap-2 sm:w-auto min-h-[44px]">
                Next Question
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// WHY: We wrap the practice page in this outer component with Suspense so that
// useParams() works correctly. Next.js requires Suspense boundaries for hooks
// that access searchParams or params in Client Components.
export default function PracticePageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    }>
      <QuestionPracticePage />
    </Suspense>
  );
}
