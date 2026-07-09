"use client";

// WHY: This is a Client Component because it links to the quiz attempt page.
// The card design matches the Apple-inspired dashboard: #F5F5F7 background,
// rounded-2xl, light shadow, clean typography.
//
// CONCEPT: Each quiz card displays the quiz name, description, stats
// as small gray pills, and a prominent "Start Quiz" button in #0A84FF.
import Link from "next/link";
import { Clock, HelpCircle } from "lucide-react";

interface QuizCard2Props {
  id: number;
  quizName: string;
  description: string | null;
  questionCount: number;
  totalPoints: number;
  timeLimit: number;
  timeLimitFormatted: string;
  categoryName: string | null;
}

export function QuizCard2({
  id,
  quizName,
  description,
  questionCount,
  timeLimitFormatted,
}: QuizCard2Props) {
  return (
    <div className="flex flex-col rounded-2xl bg-[#F5F5F7] p-6 shadow-sm transition-shadow duration-200 hover:shadow-md">
      {/* Quiz name */}
      <h3 className="text-xl font-semibold text-[#1D1D1F]">{quizName}</h3>

      {/* Description */}
      {description && (
        <p className="mt-1 line-clamp-2 text-sm text-[#6E6E73]">
          {description}
        </p>
      )}

      {/* Stats pills row */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs text-[#6E6E73]">
          <HelpCircle className="h-3 w-3" />
          {questionCount} questions
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs text-[#6E6E73]">
          <Clock className="h-3 w-3" />
          {timeLimitFormatted}
        </span>
      </div>

      {/* Spacer + button */}
      <div className="mt-auto pt-5">
        <Link href={`/dashboard/quizzes/${id}/attempt`}>
          <button className="w-full rounded-xl bg-[#0A84FF] py-3 text-sm font-medium text-white transition-colors hover:bg-[#0071E3] min-h-[44px]">
            Start Quiz
          </button>
        </Link>
      </div>
    </div>
  );
}
