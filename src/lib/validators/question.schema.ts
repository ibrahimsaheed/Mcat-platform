// CONCEPT: Zod schemas define the shape and validation rules for tRPC procedure
// inputs. They live in /lib/validators/ so they can be imported by both the
// server (tRPC router) and the client (form validation) without circular deps.
// WHY: We keep one file per domain (question.schema.ts) instead of one giant
// file so each domain's validation rules are co-located and easy to find.
import { z } from "zod";
import { Subject } from "@prisma/client";

// Helper to convert Prisma enum to a Zod union of string literals
const subjectValues = Object.values(Subject) as [string, ...string[]];

/**
 * Input schema for the question list procedure.
 * All fields are optional so the default query returns all active questions.
 */
export const QuestionListSchema = z.object({
  subject: z.enum(subjectValues).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  difficultyLevel: z.coerce.number().int().min(1).max(5).optional(),
  topicId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

/**
 * Input schema for getById — just a question ID.
 */
export const QuestionIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * Input schema for getTopics — optional subject filter.
 */
export const TopicsFilterSchema = z.object({
  subject: z.enum(subjectValues).optional(),
});

/**
 * Input schema for toggleBookmark — which question to bookmark/unbookmark.
 */
export const ToggleBookmarkSchema = z.object({
  questionId: z.coerce.number().int().positive(),
});
