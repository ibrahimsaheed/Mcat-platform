"use client";

// WHY: This is a Client Component because it links to the quiz attempt page
// and could later show interactive elements like previous attempt scores.
//
// CONCEPT: Each quiz card displays the quiz name, description, stats
// (question count, time limit), and a prominent "Start Quiz" button.
// The time limit is formatted from seconds to a human-readable string.
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Clock, HelpCircle, Zap, Award } from "lucide-react";

interface QuizCardProps {
  id: number;
  quizName: string;
  description: string | null;
  questionCount: number;
  totalPoints: number;
  timeLimit: number;
  categoryName: string | null;
}

/**
 * Formats seconds into a human-readable duration string.
 * Examples: "8 min", "9 min", "60 min (1 hour)"
 */
function formatTime(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  return `${minutes} min`;
}

export function QuizCard({
  id,
  quizName,
  description,
  questionCount,
  timeLimit,
}: QuizCardProps) {
  return (
    <div className="flex flex-col rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      {/* Quiz name */}
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {quizName}
      </h3>

      {/* Description */}
      {description && (
        <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      )}

      {/* Stats row */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1">
          <HelpCircle className="h-3.5 w-3.5" />
          {questionCount} questions
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {formatTime(timeLimit)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Zap className="h-3.5 w-3.5" />
          {questionCount} pts
        </span>
      </div>

      {/* Spacer */}
      <div className="mt-auto pt-4">
        <Link href={`/dashboard/quizzes/${id}/attempt`} className="block">
          <Button className="w-full min-h-[44px]">
            Start Quiz
          </Button>
        </Link>
      </div>
    </div>
  );
}
