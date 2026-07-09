// CONCEPT: This Inngest function runs after a quiz attempt is completed.
// It recalculates the user's score analytics per category: average score,
// best score, total attempts, and improvement trend. Results are upserted
// into the score_analytics table.
//
// WHY: Score analytics are expensive to calculate on every page load (they
// require aggregating all attempts). Instead, we calculate them in the
// background after each attempt completes and cache the results.
//
// Function ID uses kebab-case as required by AGENT.md.
//
// CONCEPT: Inngest v4 uses a 2-argument createFunction signature:
// createFunction({ id, event, retries }, handler). The event trigger is
// a property of the first options object, not a separate argument.
import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/prisma";

export const recalculateScoreAnalytics = inngest.createFunction(
  {
    id: "recalculate-score-analytics",
    triggers: { event: "quiz/attempt.completed" },
    retries: 3,
  },
  async ({ event }) => {
    const { attemptId, userId } = event.data as {
      attemptId: number;
      userId: number;
    };

    // Fetch the completed attempt with its responses
    const attempt = await prisma.userQuizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        responses: {
          include: {
            question: {
              include: {
                topicMaps: { include: { topic: true } },
              },
            },
          },
        },
        quiz: true,
      },
    });

    if (!attempt || attempt.status !== "COMPLETED") {
      throw new Error(
        `Attempt ${attemptId} not found or not completed — skipping analytics.`
      );
    }

    // Group responses by category ID (via the question's categoryId)
    const responsesByCategory = new Map<
      number | "uncategorized",
      typeof attempt.responses
    >();
    for (const response of attempt.responses) {
      const categoryId = response.question.categoryId ?? "uncategorized";
      if (!responsesByCategory.has(categoryId)) {
        responsesByCategory.set(categoryId, []);
      }
      responsesByCategory.get(categoryId)!.push(response);
    }

    // For each category, calculate stats and create/update analytics
    for (const [categoryId, responses] of responsesByCategory) {
      const totalQuestions = responses.length;
      const correctCount = responses.filter((r) => r.isCorrect).length;
      const averageScore =
        totalQuestions > 0
          ? Math.round((correctCount / totalQuestions) * 10000) / 100
          : 0;

      // Find the best score for this user+category
      const existingAnalytics = await prisma.scoreAnalytics.findFirst({
        where: {
          userId,
          categoryId: typeof categoryId === "number" ? categoryId : undefined,
        },
        orderBy: { bestScore: "desc" },
      });

      const bestScore = Math.max(
        correctCount,
        existingAnalytics?.bestScore ?? correctCount
      );

      // Count total completed attempts for this user
      const totalAttempts = await prisma.userQuizAttempt.count({
        where: {
          userId,
          status: "COMPLETED",
        },
      });

      // Calculate score delta vs the last analytics record
      const lastAnalytics = await prisma.scoreAnalytics.findFirst({
        where: {
          userId,
          categoryId: typeof categoryId === "number" ? categoryId : undefined,
        },
        orderBy: { calculatedDate: "desc" },
      });

      const scoreDelta = lastAnalytics
        ? averageScore - Number(lastAnalytics.averageScore ?? 0)
        : null;

      // Determine improvement trend — compare last 3 attempt scores
      const recentAttempts = await prisma.userQuizAttempt.findMany({
        where: { userId, status: "COMPLETED" },
        orderBy: { endTime: "desc" },
        take: 3,
      });

      const recentScores = recentAttempts
        .map((a) => (a.totalScore ?? 0) / Math.max(a.maxPossibleScore ?? 1, 1))
        .filter((s) => s > 0);

      let improvementTrend: "IMPROVING" | "DECLINING" | "STABLE" = "STABLE";
      if (recentScores.length >= 2) {
        const firstHalf = recentScores.slice(
          0,
          Math.ceil(recentScores.length / 2)
        );
        const secondHalf = recentScores.slice(
          Math.ceil(recentScores.length / 2)
        );
        const firstAvg =
          firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg =
          secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        const diff = secondAvg - firstAvg;
        if (diff > 0.05) improvementTrend = "IMPROVING";
        else if (diff < -0.05) improvementTrend = "DECLINING";
      }

      // Rolling avg of last 5 attempts
      const last5Attempts = await prisma.userQuizAttempt.findMany({
        where: { userId, status: "COMPLETED" },
        orderBy: { endTime: "desc" },
        take: 5,
      });

      const rollingAvgLast5 =
        last5Attempts.length > 0
          ? last5Attempts.reduce(
              (sum, a) => sum + (a.totalScore ?? 0),
              0
            ) / last5Attempts.length
          : null;

      // Create or update the score analytics record
      if (lastAnalytics) {
        await prisma.scoreAnalytics.update({
          where: { id: lastAnalytics.id },
          data: {
            averageScore,
            bestScore,
            totalAttempts,
            improvementTrend,
            scoreDelta: scoreDelta ?? undefined,
            rollingAvgLast5,
            isStale: false,
            calculatedDate: new Date(),
            quizId: attempt.quizId,
          },
        });
      } else {
        await prisma.scoreAnalytics.create({
          data: {
            userId,
            categoryId:
              typeof categoryId === "number" ? categoryId : undefined,
            averageScore,
            bestScore,
            totalAttempts,
            improvementTrend,
            scoreDelta: scoreDelta ?? undefined,
            rollingAvgLast5,
            isStale: false,
            calculatedDate: new Date(),
            quizId: attempt.quizId,
          },
        });
      }
    }

    return { success: true, userId, attemptId };
  }
);
