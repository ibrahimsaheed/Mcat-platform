"use client";

// CONCEPT: This is the quiz session page — the most important page in the app.
// It handles the entire quiz lifecycle: intro screen → answering questions with
// timer → auto-advance → completion → redirect to results.
//
// WHY: This must be a Client Component because it manages real-time state:
// the timer ticks every second, answers are submitted one at a time, and
// the UI auto-advances after each answer. All of this requires client-side
// JavaScript that can't be server-rendered.
//
// The page is designed mobile-first: options stack vertically as large tappable
// buttons (56px min height), the timer stays visible, and the layout works at
// 375px width.
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/trpc/client";
import { useQuizStore } from "@/store/quizStore";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Clock,
  HelpCircle,
  Loader2,
  LogOut,
  Play,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

function QuizAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = Number(params.id);

  // ── Fetch quiz data ──────────────────────────────────────────────
  const { data: quiz, isLoading, error } = api.quiz.getById.useQuery(
    { id: quizId },
    { enabled: !isNaN(quizId) }
  );

  // ── Zustand store ────────────────────────────────────────────────
  const store = useQuizStore();

  // ── Local state ──────────────────────────────────────────────────
  // Whether we're showing the intro screen or in the quiz
  const [started, setStarted] = useState(false);
  // Awaiting answer submission
  const [submitting, setSubmitting] = useState(false);
  // Showing answer feedback (green/red flash)
  const [showingFeedback, setShowingFeedback] = useState(false);
  // Whether the current question was just answered correctly
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  // Show exit confirmation dialog
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  // Countdown before auto-advance
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState(0);
  // Track response time for current question
  const questionStartTime = useRef<number>(Date.now());
  // Timer interval ref
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Auto-advance interval ref
  const autoAdvanceRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── tRPC mutations ───────────────────────────────────────────────
  const startAttemptMutation = api.quiz.startAttempt.useMutation({
    onSuccess: (data) => {
      if (quiz) {
        const questions = quiz.quizQuestions.map((qq) => ({
          id: qq.question.id,
          questionText: qq.question.questionText,
          options: qq.question.options.map((o) => ({
            id: o.id,
            optionText: o.optionText,
            isCorrect: o.isCorrect,
            optionOrder: o.optionOrder,
          })),
        }));
        store.startQuiz(data.attemptId, quizId, questions, quiz.timeLimit ?? 600);
        setStarted(true);
        questionStartTime.current = Date.now();
      }
    },
  });

  const submitAnswerMutation = api.quiz.submitAnswer.useMutation();
  const completeAttemptMutation = api.quiz.completeAttempt.useMutation({
    onSuccess: (data) => {
      store.completeQuiz();
      router.push(`/dashboard/quizzes/${quizId}/results/${data.id}`);
    },
  });

  // ── Timer effect ─────────────────────────────────────────────────
  useEffect(() => {
    if (store.timerActive && store.status === "in_progress") {
      timerIntervalRef.current = setInterval(() => {
        store.tickTimer();
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [store.timerActive, store.status]);

  // ── Handle timer expiry ──────────────────────────────────────────
  // When timer hits 0, complete the attempt
  useEffect(() => {
    if (store.timeRemainingSeconds <= 0 && store.status === "completed" && started) {
      if (store.attemptId) {
        completeAttemptMutation.mutate({ attemptId: store.attemptId });
      }
    }
  }, [store.timeRemainingSeconds, store.status, started]);

  // ── Handle answer submission ─────────────────────────────────────
  const handleAnswer = useCallback(
    async (optionId: number) => {
      // Find the matching question to check correctness
      const currentQ = store.questions[store.currentIndex];
      if (!currentQ || submitting || showingFeedback) return;

      const selectedOption = currentQ.options.find((o) => o.id === optionId);
      if (!selectedOption) return;

      const responseTimeSecs = Math.floor(
        (Date.now() - (questionStartTime.current || Date.now())) / 1000
      );

      setSubmitting(true);
      setLastAnswerCorrect(selectedOption.isCorrect);
      setShowingFeedback(true);

      // Submit answer to server
      if (store.attemptId) {
        submitAnswerMutation.mutate({
          attemptId: store.attemptId,
          questionId: currentQ.id,
          selectedOptionId: optionId,
          responseTimeSecs,
        });
      }

      // Store locally
      store.submitAnswer(
        currentQ.id,
        optionId,
        selectedOption.isCorrect,
        responseTimeSecs
      );

      // Auto-advance after 1 second
      setAutoAdvanceCountdown(1);
      autoAdvanceRef.current = setInterval(() => {
        setAutoAdvanceCountdown((prev) => {
          if (prev <= 1) {
            if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Wait 1.2s then advance or complete
      setTimeout(() => {
        setShowingFeedback(false);
        setLastAnswerCorrect(null);
        setSubmitting(false);
        setAutoAdvanceCountdown(0);
        if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);

        const isLastQuestion = store.currentIndex >= store.questions.length - 1;

        if (isLastQuestion) {
          // Complete the attempt
          if (store.attemptId) {
            completeAttemptMutation.mutate({ attemptId: store.attemptId });
          }
        } else {
          store.nextQuestion();
          questionStartTime.current = Date.now();
        }
      }, 1200);
    },
    [store, submitting, showingFeedback]
  );

  // ── Start quiz handler ──────────────────────────────────────────
  const handleStart = () => {
    startAttemptMutation.mutate({ quizId });
  };

  // ── Exit quiz handler ───────────────────────────────────────────
  const handleExit = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    if (store.attemptId && store.status === "in_progress") {
      completeAttemptMutation.mutate({ attemptId: store.attemptId });
    } else {
      store.resetQuiz();
      router.push("/dashboard/quizzes");
    }
    setShowExitConfirm(false);
  };

  // ── Format timer for display ─────────────────────────────────────
  const formatTimer = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // ── Timer color based on remaining time ──────────────────────────
  const timerColor =
    store.timeRemainingSeconds <= 60
      ? "text-red-600"
      : store.timeRemainingSeconds <= 120
        ? "text-amber-600"
        : "text-zinc-700";

  // ── Progress percentage ──────────────────────────────────────────
  const progressPct =
    store.questions.length > 0
      ? Math.round(((store.currentIndex + (showingFeedback ? 1 : 0)) / store.questions.length) * 100)
      : 0;

  // ── Loading state ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────
  if (error || !quiz) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          Quiz not found
        </p>
        <p className="text-sm text-zinc-500">
          {error?.message ?? "This quiz may have been removed or is inactive."}
        </p>
        <Link href="/dashboard/quizzes">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Quizzes
          </Button>
        </Link>
      </div>
    );
  }

  const currentQuestion = store.questions[store.currentIndex];
  const currentAnswer = currentQuestion
    ? store.answers[currentQuestion.id]
    : undefined;

  // ════════════════════════════════════════════════════
  // INTRO SCREEN
  // ════════════════════════════════════════════════════
  if (!started) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
        <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {quiz.quizName}
          </h1>
          {quiz.description && (
            <p className="mt-2 text-sm text-zinc-500">{quiz.description}</p>
          )}

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
              <HelpCircle className="h-4 w-4" />
              {quiz.quizQuestions.length} questions
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
              <Clock className="h-4 w-4" />
              {Math.round((quiz.timeLimit ?? 0) / 60)} minutes
            </div>
          </div>

          <Button
            onClick={handleStart}
            disabled={startAttemptMutation.isPending}
            size="lg"
            className="mt-8 w-full gap-2 min-h-[56px] text-base"
          >
            {startAttemptMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Play className="h-5 w-5" />
            )}
            {startAttemptMutation.isPending ? "Starting..." : "Start Quiz"}
          </Button>

          <div className="mt-4 text-center">
            <Link
              href="/dashboard/quizzes"
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Back to Quizzes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════
  // ACTIVE QUIZ
  // ════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* ── Quiz header (always visible) ────────────────────────── */}
      <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {/* Top bar: Exit, quiz name, timer */}
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleExit}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 min-h-[44px] min-w-[44px]"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>

          <span className="truncate px-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {store.questions.length > 0 && (
              <>
                Question {store.currentIndex + 1}/{store.questions.length}
              </>
            )}
          </span>

          <div className={`flex items-center gap-1.5 text-sm font-mono font-bold ${timerColor}`}>
            <Clock className="h-4 w-4" />
            {formatTimer(store.timeRemainingSeconds)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* ── Question area ───────────────────────────────────────── */}
      <div className="mx-auto max-w-2xl px-4 py-6">
        {currentQuestion && (
          <>
            {/* Question text */}
            <p className="mb-6 text-base font-medium leading-relaxed text-zinc-900 sm:text-lg dark:text-zinc-100">
              {currentQuestion.questionText}
            </p>

            {/* Answer options */}
            <div className="space-y-3">
              {currentQuestion.options
                .sort((a, b) => a.optionOrder - b.optionOrder)
                .map((option) => {
                  let optionClasses =
                    "flex w-full items-center rounded-lg border px-4 py-4 text-left text-sm leading-relaxed transition-all min-h-[56px]";

                  if (showingFeedback) {
                    if (option.isCorrect) {
                      optionClasses +=
                        " border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500 dark:bg-emerald-950 dark:text-emerald-200";
                    } else if (option.id === currentAnswer?.selectedOptionId) {
                      optionClasses +=
                        " border-red-500 bg-red-50 text-red-900 ring-1 ring-red-500 dark:bg-red-950 dark:text-red-200";
                    } else {
                      optionClasses +=
                        " border-zinc-200 bg-white text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900";
                    }
                  } else if (currentAnswer && option.id === currentAnswer.selectedOptionId) {
                    // Already answered this question (review mode)
                    optionClasses += option.isCorrect
                      ? " border-emerald-500 bg-emerald-50 dark:bg-emerald-950"
                      : " border-red-500 bg-red-50 dark:bg-red-950";
                  } else {
                    optionClasses +=
                      " border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 cursor-pointer";
                  }

                  const optionLetter = String.fromCharCode(64 + option.optionOrder);

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleAnswer(option.id)}
                      disabled={showingFeedback || currentAnswer !== undefined}
                      className={optionClasses}
                    >
                      <span className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">
                        {optionLetter}
                      </span>
                      <span className="flex-1">{option.optionText}</span>
                      {showingFeedback && option.isCorrect && (
                        <svg className="ml-2 h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {showingFeedback && !option.isCorrect && option.id === currentAnswer?.selectedOptionId && (
                        <svg className="ml-2 h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </button>
                  );
                })}
            </div>

            {/* Auto-advance message */}
            {showingFeedback && (
              <div className="mt-4 text-center text-sm text-zinc-500">
                {store.currentIndex >= store.questions.length - 1
                  ? "Loading results..."
                  : `Next question in ${autoAdvanceCountdown}s...`}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Exit confirmation dialog ────────────────────────────── */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Exit quiz?
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Your progress so far will be saved and scored. You can retry the quiz from the beginning.
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmExit}
                className="flex-1 min-h-[44px]"
              >
                Exit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuizAttemptPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    }>
      <QuizAttemptPage />
    </Suspense>
  );
}
