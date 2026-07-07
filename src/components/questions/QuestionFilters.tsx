"use client";

// WHY: This is a Client Component because it uses interactivity (dropdowns,
// slider, buttons) and syncs filter state to URL search params.
//
// CONCEPT: We keep all filters in one component so they can interact — e.g.,
// selecting a subject automatically filters the topic dropdown. Each filter
// calls onFilterChange which updates the URL, making the state shareable.
import { useMemo } from "react";
import { Subject } from "@prisma/client";
import type { QuestionCategory, McatTopic } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

// CONCEPT: We use native HTML <select> and <input type="range"> here instead
// of shadcn Select/Slider because they're simpler, more accessible, and work
// reliably without extra dependencies. The shadcn Select is used in the mobile
// Sheet, but for the sidebar form, native controls are clean and fast.
interface QuestionFiltersProps {
  categories: QuestionCategory[];
  topics: McatTopic[];
  currentSubject?: string;
  currentCategoryId?: string;
  currentDifficulty?: string;
  currentTopicId?: string;
  onFilterChange: (updates: Record<string, string | undefined>) => void;
  onClear: () => void;
}

// Subject color mapping for badges
export const subjectColors: Record<string, string> = {
  [Subject.biology]: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  [Subject.biochemistry]: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  [Subject.chemistry]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  [Subject.physics]: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  [Subject.psychology]: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  [Subject.sociology]: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
  [Subject.critical_analysis]: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
};

export function QuestionFilters({
  categories,
  topics,
  currentSubject,
  currentCategoryId,
  currentDifficulty,
  currentTopicId,
  onFilterChange,
  onClear,
}: QuestionFiltersProps) {
  // Filter topics by selected subject
  const filteredTopics = useMemo(() => {
    if (!currentSubject) return topics;
    return topics.filter((t) => t.subject === currentSubject);
  }, [topics, currentSubject]);

  const hasFilters = currentSubject || currentCategoryId || currentDifficulty || currentTopicId;

  return (
    <div className="space-y-5">
      {/* ── Subject ───────────────────────────────── */}
      <div>
        <label htmlFor="subject" className="text-sm font-medium">
          Subject
        </label>
        <select
          id="subject"
          value={currentSubject ?? ""}
          onChange={(e) => onFilterChange({ subject: e.target.value || undefined })}
          className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
        >
          <option value="">All Subjects</option>
          {Object.values(Subject).map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      {/* ── Category ──────────────────────────────── */}
      <div>
        <label htmlFor="category" className="text-sm font-medium">
          Category
        </label>
        <select
          id="category"
          value={currentCategoryId ?? ""}
          onChange={(e) => onFilterChange({ categoryId: e.target.value || undefined })}
          className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.categoryName}
            </option>
          ))}
        </select>
      </div>

      {/* ── Topic ─────────────────────────────────── */}
      <div>
        <label htmlFor="topic" className="text-sm font-medium">
          Topic
        </label>
        <select
          id="topic"
          value={currentTopicId ?? ""}
          onChange={(e) => onFilterChange({ topicId: e.target.value || undefined })}
          className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
        >
          <option value="">All Topics</option>
          {filteredTopics.map((t) => (
            <option key={t.id} value={String(t.id)}>
              {t.topicName}
            </option>
          ))}
        </select>
        {currentSubject && filteredTopics.length === 0 && (
          <p className="mt-1 text-xs text-zinc-500">
            No topics found for this subject.
          </p>
        )}
      </div>

      {/* ── Difficulty ────────────────────────────── */}
      <div>
        <label htmlFor="difficulty" className="text-sm font-medium">
          Difficulty: {currentDifficulty ?? "Any"}
        </label>
        <input
          id="difficulty"
          type="range"
          min="1"
          max="5"
          step="1"
          value={currentDifficulty ?? "0"}
          onChange={(e) => {
            const val = e.target.value;
            onFilterChange({ difficulty: val === "0" ? undefined : val });
          }}
          className="mt-2 block w-full accent-blue-600"
        />
        <div className="mt-1 flex justify-between text-xs text-zinc-400">
          <span>Any</span>
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
          <span>5</span>
        </div>
      </div>

      {/* ── Clear ─────────────────────────────────── */}
      {hasFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          className="w-full gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
