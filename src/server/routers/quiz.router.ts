// CONCEPT: tRPC router for the quiz engine — the core study loop. Every
// procedure handles one phase: listing available quizzes, starting an attempt,
// answering questions one at a time, completing the attempt, and viewing results.
//
// WHY: Keeping quiz logic in a dedicated router rather than scattering it across
// pages makes the data flow explicit: start → answer × N → complete → results.
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "@/lib/trpc/server";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { inngest } from "@/inngest/client";
import {
  QuizIdSchema,
  StartAttemptSchema,
  SubmitAnswerSchema,
  CompleteAttemptSchema,
  GetAttemptResultsSchema,
  GetUserAttemptsSchema,
} from "@/lib/validators/quiz.schema";

export const quizRouter = router({
  /**
   * List all active quizzes with their category name and question count.
   * If the user is logged in, also include their previous attempt count
   * so the UI can show "Attempted 2 times" on each card.
   *
   * CONCEPT: This is a publicProcedure — anyone can see the quiz list
   * without logging in. The user-specific data (attempt count) is only
   * included when ctx.user exists.
   */
  list: publicProcedure.query(async ({ ctx }) => {
    const quizzes = await prisma.quiz.findMany({
      where: { isActive: true },
      include: {
        category: true,
        _count: { select: { quizQuestions: true } },
      },
      orderBy: { createdDate: "asc" },
    });

    // If user is logged in, get their attempt counts per quiz
    let attemptCounts: Record<number, number> = {};
    if (ctx.user) {
      const prismaUser = await prisma.user.findUnique({
        where: { supabaseId: ctx.user.id },
      });
      if (prismaUser) {
        const attempts = await prisma.userQuizAttempt.groupBy({
          by: ["quizId"],
          where: { userId: prismaUser.id },
          _count: { id: true },
        });
        attempts.forEach((a) => {
          attemptCounts[a.quizId] = a._count.id;
        });
      }
    }

    return quizzes.map((q) => ({
      ...q,
      questionCount: q._count.quizQuestions,
      attemptCount: attemptCounts[q.id] ?? 0,
      _count: undefined,
    }));
  }),

  /**
   * Get a single quiz with all its questions and options.
   * Options are returned in a random order each time so the user
   * can't memorize answer positions.
   *
   * CONCEPT: The Fisher-Yates shuffle randomizes the options array.
   * This happens server-side so the client always gets a fresh shuffle.
   */
  getById: publicProcedure
    .input(QuizIdSchema)
    .query(async ({ input }) => {
      const quiz = await prisma.quiz.findFirst({
        where: { id: input.id, isActive: true },
        include: {
          category: true,
          quizQuestions: {
            orderBy: { questionOrder: "asc" },
            include: {
              question: {
                include: {
                  options: true,
                  topicMaps: { include: { topic: true } },
                },
              },
            },
          },
        },
      });

      if (!quiz) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Quiz with id ${input.id} not found.`,
        });
      }

      // Shuffle options for each question (Fisher-Yates)
      const shuffled = quiz.quizQuestions.map((qq) => {
        const options = [...qq.question.options];
        for (let i = options.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [options[i], options[j]] = [options[j], options[i]];
        }
        return {
          ...qq,
          question: { ...qq.question, options },
        };
      });

      return { ...quiz, quizQuestions: shuffled };
    }),

  /**
   * Start a new quiz attempt.
   * Creates a UserQuizAttempt record with status IN_PROGRESS.
   * Calculates attemptNumber by counting previous attempts + 1.
   */
  startAttempt: protectedProcedure
    .input(StartAttemptSchema)
    .mutation(async ({ ctx, input }) => {
      const prismaUser = await prisma.user.findUnique({
        where: { supabaseId: ctx.user.id },
      });

      if (!prismaUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User profile not found. Please sign up first.",
        });
      }

      // Verify the quiz exists and is active
      const quiz = await prisma.quiz.findFirst({
        where: { id: input.quizId, isActive: true },
      });

      if (!quiz) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quiz not found or inactive.",
        });
      }

      // Count previous attempts for attemptNumber
      const prevCount = await prisma.userQuizAttempt.count({
        where: {
          userId: prismaUser.id,
          quizId: input.quizId,
        },
      });

      const attempt = await prisma.userQuizAttempt.create({
        data: {
          userId: prismaUser.id,
          quizId: input.quizId,
          attemptNumber: prevCount + 1,
          startTime: new Date(),
          status: "IN_PROGRESS",
        },
      });

      return { attemptId: attempt.id };
    }),

  /**
   * Submit an answer for a single question during an active attempt.
   *
   * Verifies the attempt belongs to the authenticated user and is still
   * IN_PROGRESS. Looks up if the selected option is correct and returns
   * the result without revealing the explanation (that comes from getById).
   */
  submitAnswer: protectedProcedure
    .input(SubmitAnswerSchema)
    .mutation(async ({ ctx, input }) => {
      const prismaUser = await prisma.user.findUnique({
        where: { supabaseId: ctx.user.id },
      });

      if (!prismaUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User profile not found.",
        });
      }

      // Verify the attempt exists and belongs to this user
      const attempt = await prisma.userQuizAttempt.findUnique({
        where: { id: input.attemptId },
      });

      if (!attempt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Attempt not found.",
        });
      }

      if (attempt.userId !== prismaUser.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "This attempt does not belong to you.",
        });
      }

      if (attempt.status !== "IN_PROGRESS") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This attempt is already completed.",
        });
      }

      // Look up if the selected option is correct
      const selectedOption = await prisma.questionOption.findUnique({
        where: { id: input.selectedOptionId },
      });

      if (!selectedOption) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Selected option not found.",
        });
      }

      const isCorrect = selectedOption.isCorrect;

      // Create the answer response
      await prisma.userAnswerResponse.create({
        data: {
          attemptId: input.attemptId,
          questionId: input.questionId,
          selectedOptionId: input.selectedOptionId,
          isCorrect,
          confidenceLevel: input.confidenceLevel ?? null,
          responseTime: input.responseTimeSecs,
          answeredAt: new Date(),
        },
      });

      return { isCorrect };
    }),

  /**
   * Complete an attempt — calculate score, set end time, mark as COMPLETED.
   *
   * Returns the full results so the client can immediately show the score
   * without an additional request.
   */
  completeAttempt: protectedProcedure
    .input(CompleteAttemptSchema)
    .mutation(async ({ ctx, input }) => {
      const prismaUser = await prisma.user.findUnique({
        where: { supabaseId: ctx.user.id },
      });

      if (!prismaUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User profile not found.",
        });
      }

      const attempt = await prisma.userQuizAttempt.findUnique({
        where: { id: input.attemptId },
        include: {
          responses: true,
          quiz: {
            include: {
              quizQuestions: true,
            },
          },
        },
      });

      if (!attempt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Attempt not found.",
        });
      }

      if (attempt.userId !== prismaUser.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "This attempt does not belong to you.",
        });
      }

      if (attempt.status === "COMPLETED") {
        // Already completed — just return the existing data
        return attempt;
      }

      // Calculate score
      const totalScore = attempt.responses.filter((r) => r.isCorrect).length;
      const maxPossibleScore = attempt.quiz.quizQuestions.length;
      const percentageScore =
        maxPossibleScore > 0
          ? Math.round((totalScore / maxPossibleScore) * 10000) / 100
          : 0;

      const timeSpent = Math.floor(
        (Date.now() - new Date(attempt.startTime).getTime()) / 1000
      );

      const updated = await prisma.userQuizAttempt.update({
        where: { id: input.attemptId },
        data: {
          status: "COMPLETED",
          endTime: new Date(),
          totalScore,
          maxPossibleScore,
          percentageScore,
          timeSpent,
        },
        include: {
          responses: {
            include: {
              question: {
                include: {
                  options: true,
                },
              },
              selectedOption: true,
            },
          },
          quiz: {
            include: {
              quizQuestions: {
                include: {
                  question: {
                    include: {
                      options: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Fire Inngest event for background score recalculation
      // WHY: We fire and forget — score analytics don't need to block the
      // response. The Inngest function runs asynchronously and recalculates
      // the user's performance metrics per category.
      try {
        await inngest.send({
          name: "quiz/attempt.completed",
          data: {
            attemptId: updated.id,
            userId: updated.userId,
          },
        });
      } catch (inngestError) {
        // Don't let Inngest errors break the quiz completion flow.
        // In development, Inngest may not be running — that's fine.
        console.warn("Failed to send Inngest event:", inngestError);
      }

      return updated;
    }),

  /**
   * Get full results for a completed attempt.
   *
   * Returns all questions with correct answers, the user's selected answer,
   * whether each was correct, time per question, overall score, and
   * improvement percentage vs the previous attempt if one exists.
   */
  getAttemptResults: protectedProcedure
    .input(GetAttemptResultsSchema)
    .query(async ({ ctx, input }) => {
      const prismaUser = await prisma.user.findUnique({
        where: { supabaseId: ctx.user.id },
      });

      if (!prismaUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User profile not found.",
        });
      }

      const attempt = await prisma.userQuizAttempt.findUnique({
        where: { id: input.attemptId },
        include: {
          quiz: {
            include: {
              quizQuestions: {
                orderBy: { questionOrder: "asc" },
                include: {
                  question: {
                    include: { options: true },
                  },
                },
              },
            },
          },
          responses: {
            include: {
              question: {
                include: {
                  options: true,
                  topicMaps: { include: { topic: true } },
                },
              },
              selectedOption: true,
            },
          },
        },
      });

      if (!attempt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Attempt not found.",
        });
      }

      if (attempt.userId !== prismaUser.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "This attempt does not belong to you.",
        });
      }

      // Find previous attempt for comparison
      const previousAttempt = await prisma.userQuizAttempt.findFirst({
        where: {
          userId: prismaUser.id,
          quizId: attempt.quizId,
          status: "COMPLETED",
          id: { lt: attempt.id },
        },
        orderBy: { id: "desc" },
      });

      const improvement =
        previousAttempt && previousAttempt.percentageScore != null
          ? Math.round(
              (Number(attempt.percentageScore ?? 0) - Number(previousAttempt.percentageScore)) * 100
            ) / 100
          : null;

      return {
        ...attempt,
        improvement,
        previousPercentageScore: previousAttempt?.percentageScore ?? null,
      };
    }),

  /**
   * Get all previous attempts for the logged-in user for a specific quiz.
   * Ordered by attemptNumber descending so the most recent is first.
   */
  getUserAttempts: protectedProcedure
    .input(GetUserAttemptsSchema)
    .query(async ({ ctx, input }) => {
      const prismaUser = await prisma.user.findUnique({
        where: { supabaseId: ctx.user.id },
      });

      if (!prismaUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User profile not found.",
        });
      }

      return prisma.userQuizAttempt.findMany({
        where: {
          userId: prismaUser.id,
          quizId: input.quizId,
        },
        orderBy: { attemptNumber: "desc" },
      });
    }),
});

export type QuizRouter = typeof quizRouter;
