// CONCEPT: tRPC routers group related procedures (queries and mutations) under
// a single namespace. All question-related operations live here — listing,
// filtering, getting details, and bookmarking.
//
// WHY: We keep one router per domain (question.router.ts) so each domain's
// procedures are co-located and the root router just composes them together.
import { publicProcedure, protectedProcedure, router } from "@/lib/trpc/server";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import {
  QuestionListSchema,
  QuestionIdSchema,
  TopicsFilterSchema,
  ToggleBookmarkSchema,
} from "@/lib/validators/question.schema";

export const questionRouter = router({
  /**
   * List questions with optional filters and pagination.
   *
   * CONCEPT: This is a publicProcedure (no auth required) so anyone can browse
   * the question bank. Filters are optional — omitting them returns all active
   * questions paginated.
   *
   * We use skip/take for pagination and include the relations the UI needs:
   * options (answer choices), category (section name), and topicMaps (which
   * topics the question covers). The total count is returned so the UI can
   * show "Showing X-Y of Z" and calculate total pages.
   */
  list: publicProcedure
    .input(QuestionListSchema)
    .query(async ({ input }) => {
      const { subject, categoryId, difficultyLevel, topicId, page, limit } = input;

      // Build the where clause dynamically from the provided filters.
      // WHY: Prisma's where clause is a plain object, so we can conditionally
      // add properties. This is cleaner than building raw SQL strings.
      const where: Record<string, unknown> = { isActive: true };

      // ── Filters ────────────────────────────────────────────────
      // WHY: topicId and subject both filter through the topicMaps relation.
      // When topicId is set, we filter by that specific topic. When only
      // subject is set (no topicId), we filter by topic subject — this lets
      // "physics" find questions in the "Chemical & Physical Foundations"
      // category that have physics topics, without relying on category names.
      if (topicId) {
        where.topicMaps = { some: { topicId } };
      } else if (subject) {
        where.topicMaps = { some: { topic: { subject } } };
      }

      if (categoryId) where.categoryId = categoryId;
      if (difficultyLevel) where.difficultyLevel = difficultyLevel;

      const skip = (page - 1) * limit;

      // Run count and findMany in parallel for performance.
      const [questions, total] = await Promise.all([
        prisma.question.findMany({
          where,
          skip,
          take: limit,
          include: {
            options: {
              orderBy: { optionOrder: "asc" },
            },
            category: true,
            topicMaps: {
              include: { topic: true },
            },
          },
          orderBy: { id: "asc" },
        }),
        prisma.question.count({ where }),
      ]);

      return {
        questions,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }),

  /**
   * Get a single question by ID with all related data.
   *
   * Returns the question with its options, category, topic maps, and passage
   * (if one is attached). Throws NOT_FOUND if the question doesn't exist or
   * is not active.
   */
  getById: publicProcedure
    .input(QuestionIdSchema)
    .query(async ({ input }) => {
      const question = await prisma.question.findFirst({
        where: { id: input.id, isActive: true },
        include: {
          options: {
            orderBy: { optionOrder: "asc" },
          },
          category: true,
          topicMaps: {
            include: { topic: true },
          },
          passage: true,
        },
      });

      if (!question) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Question with id ${input.id} not found or is inactive.`,
        });
      }

      return question;
    }),

  /**
   * Get all active question categories.
   * Used to populate the category filter dropdown in the question bank UI.
   */
  getCategories: publicProcedure.query(async () => {
    return prisma.questionCategory.findMany({
      where: { isActive: true },
      orderBy: { categoryName: "asc" },
    });
  }),

  /**
   * Get all active MCAT topics, optionally filtered by subject.
   * Used to populate the topic filter dropdown. When a subject is selected,
   * only topics in that subject are returned.
   */
  getTopics: publicProcedure
    .input(TopicsFilterSchema.optional())
    .query(async ({ input }) => {
      const where: Record<string, unknown> = { isActive: true };

      if (input?.subject) {
        where.subject = input.subject;
      }

      return prisma.mcatTopic.findMany({
        where,
        orderBy: [{ subject: "asc" }, { topicName: "asc" }],
      });
    }),

  /**
   * Toggle a bookmark on a question for the current user.
   *
   * CONCEPT: This is a protectedProcedure because it touches user-specific data.
   * If the bookmark already exists, we remove it (unbookmark). If it doesn't
   * exist, we create it. This lets the client use one toggle endpoint instead
   * of separate bookmark/unbookmark calls.
   */
  toggleBookmark: protectedProcedure
    .input(ToggleBookmarkSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const supabaseId = ctx.user.id;

      // First, look up the Prisma user by supabaseId
      const prismaUser = await prisma.user.findUnique({
        where: { supabaseId },
      });

      if (!prismaUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User profile not found. Please sign up first.",
        });
      }

      const existing = await prisma.questionBookmark.findUnique({
        where: {
          userId_questionId: {
            userId: prismaUser.id,
            questionId: input.questionId,
          },
        },
      });

      if (existing) {
        // Unbookmark — remove the existing bookmark
        await prisma.questionBookmark.delete({
          where: { id: existing.id },
        });
        return { bookmarked: false };
      } else {
        // Bookmark — create a new bookmark
        await prisma.questionBookmark.create({
          data: {
            userId: prismaUser.id,
            questionId: input.questionId,
          },
        });
        return { bookmarked: true };
      }
    }),
});

export type QuestionRouter = typeof questionRouter;
