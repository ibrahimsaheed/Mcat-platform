"use client";

// WHY: This Client Component renders the question cards with pagination.
// It receives already-fetched data and displays it. The isFetching flag
// shows a loading indicator when the user changes filters.
//
// CONCEPT: Question cards show a truncated preview of the question text,
// a subject badge (color-coded by Subject enum), difficulty dots, the
// category name, and a "Practice" button that navigates to the single-
// question practice page.
import { useMemo } from "react";
import Link from "next/link";
import type { Question, QuestionCategory, McatTopic, QuestionOption, QuestionTopicMap } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { subjectColors } from "./QuestionFilters";

// Concise names for subjects (for display in badges)
// WHY: The database uses snake_case subject names (e.g., "critical_analysis"),
// but the UI should show human-readable labels.
const subjectLabels: Record<string, string> = {
  biology: "Biology",
  biochemistry: "Biochem",
  chemistry: "Chemistry",
  physics: "Physics",
  psychology: "Psych",
  sociology: "Sociology",
  critical_analysis: "CARS",
};

type QuestionWithRelations = Question & {
  options: QuestionOption[];
  category: QuestionCategory | null;
  topicMaps: (QuestionTopicMap & { topic: McatTopic })[];
};

interface QuestionListProps {
  questions: QuestionWithRelations[];
  total: number;
  page: number;
  totalPages: number;
  isFetching: boolean;
  onPageChange: (page: number) => void;
}

export function QuestionList({
  questions,
  total,
  page,
  totalPages,
  isFetching,
  onPageChange,
}: QuestionListProps) {
  // Extract subject from the first topic (if any) or from the category
  const getSubjectForQuestion = (q: QuestionWithRelations): string | null => {
    if (q.topicMaps.length > 0) {
      return q.topicMaps[0].topic.subject;
    }
    return null;
  };

  const startItem = total === 0 ? 0 : (page - 1) * 20 + 1;
  const endItem = Math.min(page * 20, total);

  return (
    <div className="space-y-4">
      {/* ── Results header ─────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {isFetching ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating...
            </span>
          ) : (
            <>
              Showing{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {startItem}–{endItem}
              </span>{" "}
              of <span className="font-medium">{total}</span> questions
            </>
          )}
        </p>
      </div>

      {/* ── Question cards ─────────────────────────── */}
      {questions.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            No questions found
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Try adjusting your filters or clearing them to see all questions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => {
            const subject = getSubjectForQuestion(q);
            const colorClass = subject ? subjectColors[subject] ?? "" : "";
            const label = subject ? subjectLabels[subject] ?? subject : "";

            return (
              <div
                key={q.id}
                className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* ── Badges row ──────────────────────── */}
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {subject && (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
                        >
                          {label}
                        </span>
                      )}
                      {q.category && (
                        <span className="inline-flex items-center rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                          {q.category.categoryName}
                        </span>
                      )}
                      {q.difficultyLevel && (
                        <span className="inline-flex items-center gap-0.5 text-xs text-zinc-400">
                          {/* 1–5 dots indicating difficulty */}
                          {Array.from({ length: 5 }, (_, i) => (
                            <span
                              key={i}
                              className={`inline-block h-1.5 w-1.5 rounded-full ${
                                i < (q.difficultyLevel ?? 0)
                                  ? "bg-zinc-600 dark:bg-zinc-300"
                                  : "bg-zinc-200 dark:bg-zinc-700"
                              }`}
                            />
                          ))}
                        </span>
                      )}
                    </div>

                    {/* ── Question text ─────────────────────── */}
                    <p className="line-clamp-2 text-sm leading-relaxed text-zinc-900 dark:text-zinc-100">
                      {q.questionText}
                    </p>
                  </div>

                  {/* ── Practice button ─────────────────────── */}
                  <Link
                    href={`/dashboard/questions/${q.id}`}
                    className="shrink-0"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-[44px] min-w-[44px]"
                    >
                      Practice
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ─────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isFetching}
            onClick={() => onPageChange(page - 1)}
            className="min-h-[44px] min-w-[44px]"
          >
            Previous
          </Button>

          <span className="text-sm text-zinc-500">
            Page {page} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isFetching}
            onClick={() => onPageChange(page + 1)}
            className="min-h-[44px] min-w-[44px]"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
