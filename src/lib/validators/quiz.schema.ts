// CONCEPT: Zod schemas for quiz-related tRPC procedures. One file per domain
// keeps validation logic co-located and shareable between server and client.
import { z } from "zod";

/**
 * Input schema for getById — just a quiz ID.
 */
export const QuizIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * Input schema for startAttempt — which quiz to start.
 */
export const StartAttemptSchema = z.object({
  quizId: z.coerce.number().int().positive(),
});

/**
 * Input schema for submitAnswer — the user's answer to a single question.
 *
 * responseTimeSecs is how many seconds the user spent on this question.
 * confidenceLevel is optional (1-5 scale, null if not provided).
 */
export const SubmitAnswerSchema = z.object({
  attemptId: z.coerce.number().int().positive(),
  questionId: z.coerce.number().int().positive(),
  selectedOptionId: z.coerce.number().int().positive(),
  confidenceLevel: z.coerce.number().int().min(1).max(5).optional(),
  responseTimeSecs: z.coerce.number().int().min(0),
});

/**
 * Input schema for completeAttempt — finish an attempt.
 */
export const CompleteAttemptSchema = z.object({
  attemptId: z.coerce.number().int().positive(),
});

/**
 * Input schema for getAttemptResults — view results.
 */
export const GetAttemptResultsSchema = z.object({
  attemptId: z.coerce.number().int().positive(),
});

/**
 * Input schema for getUserAttempts — list previous attempts for a quiz.
 */
export const GetUserAttemptsSchema = z.object({
  quizId: z.coerce.number().int().positive(),
});
