"use client";

// WHY: This is the main Client Component wrapper for the question bank page.
// It manages the filter state and coordinates between the filter sidebar and
// the question list. It uses URL search params so filter state is shareable.
//
// CONCEPT: We keep this as one Client Component because the filters and the
// question list share state (selected filters, page number). Separating them
// would require a state management solution; co-locating is simpler here.
import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/trpc/client";
import { QuestionFilters } from "@/components/questions/QuestionFilters";
import { QuestionList } from "@/components/questions/QuestionList";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FilterIcon } from "lucide-react";
import type { Question, QuestionCategory, McatTopic, QuestionOption, QuestionTopicMap } from "@prisma/client";

// Extended types for the question with relations
type QuestionWithRelations = Question & {
  options: QuestionOption[];
  category: QuestionCategory | null;
  topicMaps: (QuestionTopicMap & { topic: McatTopic })[];
};

interface QuestionBankContentProps {
  initialQuestions: QuestionWithRelations[];
  initialTotal: number;
  categories: QuestionCategory[];
  topics: McatTopic[];
}

export function QuestionBankContent({
  initialQuestions,
  initialTotal,
  categories,
  topics,
}: QuestionBankContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial filter values from URL search params
  const subject = searchParams.get("subject") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;
  const difficultyLevel = searchParams.get("difficulty") || undefined;
  const topicId = searchParams.get("topicId") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);

  // Track mobile filter sheet open state
  const [sheetOpen, setSheetOpen] = useState(false);

  // Build the query input object from URL params
  const queryInput = {
    subject: subject || undefined,
    categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
    difficultyLevel: difficultyLevel ? parseInt(difficultyLevel, 10) : undefined,
    topicId: topicId ? parseInt(topicId, 10) : undefined,
    page,
    limit: 20,
  };

  // Fetch questions with filters via tRPC
  // WHY: We use useQuery with the initial data from the Server Component so the
  // page renders immediately, then refetches when filters change.
  const { data, isFetching } = api.question.list.useQuery(queryInput, {
    initialData: page === 1 && !subject && !categoryId && !difficultyLevel && !topicId
      ? { questions: initialQuestions, total: initialTotal, page: 1, totalPages: Math.ceil(initialTotal / 20) }
      : undefined,
    placeholderData: (prev) => prev,
  });

  const questions = data?.questions ?? initialQuestions;
  const total = data?.total ?? initialTotal;
  const totalPages = data?.totalPages ?? 1;

  // Update URL params when filters change
  // WHY: URL-based state means filters survive page refresh and can be shared.
  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      // Reset to page 1 when filters change (unless page itself is changing)
      if (!("page" in updates)) {
        params.set("page", "1");
      }
      router.push(`/dashboard/questions?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push("/dashboard/questions");
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* ── Mobile header with filter button ─────────────────────── */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900 md:hidden">
        <h1 className="text-lg font-semibold">Question Bank</h1>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger>
            <span className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 min-h-[44px] min-w-[44px] cursor-pointer">
              <FilterIcon className="h-4 w-4" />
              Filters
            </span>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] sm:w-[320px]">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <QuestionFilters
                categories={categories}
                topics={topics}
                currentSubject={subject}
                currentCategoryId={categoryId}
                currentDifficulty={difficultyLevel}
                currentTopicId={topicId}
                onFilterChange={updateParams}
                onClear={clearFilters}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ── Desktop layout ───────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
          {/* ── Desktop sidebar filters ──────────────────────────── */}
          <aside className="hidden md:block">
            <div className="sticky top-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Filters
              </h2>
              <QuestionFilters
                categories={categories}
                topics={topics}
                currentSubject={subject}
                currentCategoryId={categoryId}
                currentDifficulty={difficultyLevel}
                currentTopicId={topicId}
                onFilterChange={updateParams}
                onClear={clearFilters}
              />
            </div>
          </aside>

          {/* ── Question list ────────────────────────────────────── */}
          <main>
            <QuestionList
              questions={questions}
              total={total}
              page={page}
              totalPages={totalPages}
              isFetching={isFetching}
              onPageChange={(newPage) => updateParams({ page: String(newPage) })}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
