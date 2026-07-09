// CONCEPT: Zustand is a lightweight state manager for React. We use it to
// manage the quiz session's complex state (current question, timer ticking,
// answers accumulated so far) so it persists across re-renders without
// prop drilling through every component in the quiz flow.
//
// WHY: The quiz session has multiple pieces of state that change frequently
// (timer counts down every second, current question index advances,
// answers accumulate). Zustand keeps all this in a single store outside
// the React tree so components can subscribe to only the slices they need.
//
// Zustand v5 uses `create` which returns a hook. The store is defined with
// a "set" function for immutable updates.
import { create } from "zustand";

// ── Types ──────────────────────────────────────────────────────────

/** A question with its options loaded. */
export interface QuestionWithOptions {
  id: number;
  questionText: string;
  options: {
    id: number;
    optionText: string;
    isCorrect: boolean;
    optionOrder: number;
  }[];
}

/** The user's answer to a single question, stored by question ID. */
export interface AnswerRecord {
  selectedOptionId: number;
  isCorrect: boolean;
  responseTimeSecs: number;
  confidenceLevel?: number;
}

/** Possible states of the quiz session lifecycle. */
export type QuizStatus = "idle" | "in_progress" | "completed";

// ── Store shape ────────────────────────────────────────────────────

interface QuizStore {
  // Session state
  attemptId: number | null;
  quizId: number | null;
  questions: QuestionWithOptions[];
  currentIndex: number;
  answers: Record<number, AnswerRecord>;
  status: QuizStatus;

  // Timer state
  timeRemainingSeconds: number;
  timerActive: boolean;

  // Actions
  startQuiz: (
    attemptId: number,
    quizId: number,
    questions: QuestionWithOptions[],
    timeLimitSecs: number
  ) => void;
  submitAnswer: (
    questionId: number,
    selectedOptionId: number,
    isCorrect: boolean,
    responseTimeSecs: number,
    confidenceLevel?: number
  ) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  completeQuiz: () => void;
  tickTimer: () => void;
  resetQuiz: () => void;
}

// ── Derived helpers ────────────────────────────────────────────────

export const useQuizStore = create<QuizStore>((set, get) => ({
  // ── Initial state ─────────────────────────────────────────────
  attemptId: null,
  quizId: null,
  questions: [],
  currentIndex: 0,
  answers: {},
  status: "idle",
  timeRemainingSeconds: 0,
  timerActive: false,

  // ── Actions ───────────────────────────────────────────────────

  /**
   * Start a new quiz session with the given attempt and questions.
   * Resets any previous session state and starts the timer.
   */
  startQuiz: (attemptId, quizId, questions, timeLimitSecs) =>
    set({
      attemptId,
      quizId,
      questions,
      currentIndex: 0,
      answers: {},
      status: "in_progress",
      timeRemainingSeconds: timeLimitSecs,
      timerActive: true,
    }),

  /**
   * Record the user's answer for the current question.
   * Stores it by questionId so we can look it up later for review.
   */
  submitAnswer: (questionId, selectedOptionId, isCorrect, responseTimeSecs, confidenceLevel) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: {
          selectedOptionId,
          isCorrect,
          responseTimeSecs,
          confidenceLevel,
        },
      },
    })),

  /**
   * Advance to the next question if there is one.
   * If already on the last question, this is a no-op (completeQuiz handles the end).
   */
  nextQuestion: () =>
    set((state) => {
      if (state.currentIndex < state.questions.length - 1) {
        return { currentIndex: state.currentIndex + 1 };
      }
      return {};
    }),

  /**
   * Go back to the previous question (for review during the attempt).
   */
  previousQuestion: () =>
    set((state) => {
      if (state.currentIndex > 0) {
        return { currentIndex: state.currentIndex - 1 };
      }
      return {};
    }),

  /**
   * Mark the quiz as completed and stop the timer.
   */
  completeQuiz: () =>
    set({
      status: "completed",
      timerActive: false,
    }),

  /**
   * Decrement the timer by 1 second.
   * When it hits 0, auto-complete the quiz.
   *
   * CONCEPT: The timer is driven by a setInterval in a React useEffect.
   * Each tick calls this action. When timeRemainingSeconds hits 0,
   * it sets timerActive to false to stop further ticks.
   */
  tickTimer: () =>
    set((state) => {
      if (state.timeRemainingSeconds <= 1) {
        return {
          timeRemainingSeconds: 0,
          timerActive: false,
          status: "completed",
        };
      }
      return { timeRemainingSeconds: state.timeRemainingSeconds - 1 };
    }),

  /**
   * Full reset — clears everything back to idle.
   */
  resetQuiz: () =>
    set({
      attemptId: null,
      quizId: null,
      questions: [],
      currentIndex: 0,
      answers: {},
      status: "idle",
      timeRemainingSeconds: 0,
      timerActive: false,
    }),
}));
