-- CreateEnum
CREATE TYPE "Subject" AS ENUM ('biology', 'chemistry', 'physics', 'psychology', 'sociology', 'biochemistry', 'critical_analysis');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('multiple_choice', 'true_false', 'passage_based', 'discrete');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FLAGGED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ImprovementTrend" AS ENUM ('IMPROVING', 'DECLINING', 'STABLE');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "SectionStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('FACTUALLY_INCORRECT', 'LOGIC_ERROR', 'TYPO', 'POOR_EXPLANATION', 'OTHER');

-- CreateEnum
CREATE TYPE "BookmarkTag" AS ENUM ('REVIEW_LATER', 'CONFUSED', 'IMPORTANT', 'MASTERED');

-- CreateEnum
CREATE TYPE "ExperienceType" AS ENUM ('SHADOWING', 'VOLUNTEERING', 'CLINICAL');

-- CreateEnum
CREATE TYPE "PrereqType" AS ENUM ('BIOLOGY', 'CHEMISTRY', 'PHYSICS', 'MATH', 'ENGLISH', 'OTHER');

-- CreateEnum
CREATE TYPE "CompletionStatus" AS ENUM ('COMPLETED', 'IN_PROGRESS', 'PLANNED');

-- CreateEnum
CREATE TYPE "AuthorshipType" AS ENUM ('FIRST', 'CO_AUTHOR', 'LAST');

-- CreateEnum
CREATE TYPE "PresentationType" AS ENUM ('NONE', 'POSTER', 'ORAL', 'WORKSHOP', 'OTHER');

-- CreateEnum
CREATE TYPE "MasteryLevel" AS ENUM ('KNOWN', 'NEEDS_PRACTICE', 'UNFAMILIAR');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('STREAK_REMINDER', 'STUDY_PLAN_CHECKIN', 'DAILY_PRACTICE_POSTED', 'EXAM_DATE_APPROACHING', 'SCORE_MILESTONE', 'FEEDBACK_RESOLVED', 'GENERAL');

-- CreateEnum
CREATE TYPE "ShowExplanationsAfter" AS ENUM ('IMMEDIATELY', 'AFTER_QUIZ', 'NEVER');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- CreateEnum
CREATE TYPE "FontSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('MD', 'DO', 'MD_PHD');

-- CreateEnum
CREATE TYPE "SchoolListCategory" AS ENUM ('REACH', 'TARGET', 'SAFETY', 'WITHDRAWN', 'ACCEPTED', 'REJECTED', 'WAITLISTED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('NOT_STARTED', 'PRIMARY_SUBMITTED', 'SECONDARY_RECEIVED', 'SECONDARY_SUBMITTED', 'INTERVIEW_INVITED', 'INTERVIEW_COMPLETED', 'ACCEPTED', 'REJECTED', 'WAITLISTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "StatementType" AS ENUM ('PRIMARY', 'SECONDARY', 'WHY_SCHOOL', 'DIVERSITY', 'CHALLENGE', 'OTHER');

-- CreateEnum
CREATE TYPE "DraftStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'FINAL');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "secondName" TEXT,
    "thirdName" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "score_analytics" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "categoryId" INTEGER,
    "quizId" INTEGER,
    "averageScore" DECIMAL(5,2),
    "bestScore" INTEGER,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptDate" TIMESTAMP(3),
    "improvementTrend" "ImprovementTrend",
    "scoreDelta" DECIMAL(6,2),
    "rollingAvgLast5" DECIMAL(5,2),
    "isStale" BOOLEAN NOT NULL DEFAULT true,
    "calculatedDate" TIMESTAMP(3),

    CONSTRAINT "score_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_categories" (
    "id" SERIAL NOT NULL,
    "categoryName" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mcat_topics" (
    "id" SERIAL NOT NULL,
    "parentTopicId" INTEGER,
    "subject" "Subject" NOT NULL,
    "topicName" TEXT NOT NULL,
    "subTopicName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "mcat_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passages" (
    "id" SERIAL NOT NULL,
    "subject" "Subject" NOT NULL,
    "topicId" INTEGER,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "attribution" TEXT,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "passages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" SERIAL NOT NULL,
    "passageId" INTEGER,
    "categoryId" INTEGER,
    "questionText" TEXT NOT NULL,
    "explanation" TEXT,
    "questionType" "QuestionType" NOT NULL,
    "difficultyLevel" INTEGER,
    "pointValue" INTEGER NOT NULL DEFAULT 1,
    "timeLimit" INTEGER,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "generationPrompt" TEXT,
    "modelVersion" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastModified" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "optionText" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "optionOrder" INTEGER NOT NULL,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_topic_map" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "topicId" INTEGER NOT NULL,

    CONSTRAINT "question_topic_map_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_feedback" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "feedbackType" "FeedbackType" NOT NULL,
    "comment" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_bookmarks" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "tag" "BookmarkTag" NOT NULL DEFAULT 'REVIEW_LATER',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" SERIAL NOT NULL,
    "quizName" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" INTEGER,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "timeLimit" INTEGER,
    "createdBy" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_questions" (
    "id" SERIAL NOT NULL,
    "quizId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "questionOrder" INTEGER NOT NULL,
    "pointOverride" INTEGER,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_quiz_attempts" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "quizId" INTEGER NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "totalScore" INTEGER,
    "maxPossibleScore" INTEGER,
    "percentageScore" DECIMAL(5,2),
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "timeSpent" INTEGER,

    CONSTRAINT "user_quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_answer_responses" (
    "id" SERIAL NOT NULL,
    "attemptId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "userAnswer" TEXT,
    "selectedOptionId" INTEGER,
    "confidenceLevel" INTEGER,
    "pointsEarned" INTEGER,
    "isCorrect" BOOLEAN NOT NULL,
    "responseTime" INTEGER,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_answer_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_practice_sets" (
    "id" SERIAL NOT NULL,
    "subject" "Subject" NOT NULL,
    "datePosted" DATE NOT NULL,
    "createdBy" INTEGER,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "daily_practice_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_practice_questions" (
    "id" SERIAL NOT NULL,
    "practiceSetId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,

    CONSTRAINT "daily_practice_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulated_exam_templates" (
    "id" SERIAL NOT NULL,
    "templateName" TEXT NOT NULL,
    "description" TEXT,
    "totalSections" INTEGER NOT NULL DEFAULT 4,
    "totalQuestions" INTEGER NOT NULL DEFAULT 230,
    "totalTimeMins" INTEGER NOT NULL DEFAULT 450,
    "isOfficialFormat" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulated_exam_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulated_exam_sections" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "sectionOrder" INTEGER NOT NULL,
    "sectionName" TEXT NOT NULL,
    "sectionCode" TEXT NOT NULL,
    "numQuestions" INTEGER NOT NULL,
    "timeLimitMins" INTEGER NOT NULL,
    "subject" "Subject" NOT NULL,

    CONSTRAINT "simulated_exam_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulated_exam_section_questions" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "questionOrder" INTEGER NOT NULL,

    CONSTRAINT "simulated_exam_section_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_simulated_exam_attempts" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "templateId" INTEGER NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "scoreCp" INTEGER,
    "scoreCars" INTEGER,
    "scoreBb" INTEGER,
    "scorePs" INTEGER,
    "totalScore" INTEGER,
    "percentileRank" DECIMAL(5,2),
    "timeSpentMins" INTEGER,

    CONSTRAINT "user_simulated_exam_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_simulated_section_results" (
    "id" SERIAL NOT NULL,
    "attemptId" INTEGER NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "rawScore" INTEGER NOT NULL,
    "scaledScore" INTEGER,
    "timeSpentMins" INTEGER,
    "status" "SectionStatus" NOT NULL DEFAULT 'NOT_STARTED',

    CONSTRAINT "user_simulated_section_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulated_exam_responses" (
    "id" SERIAL NOT NULL,
    "attemptId" INTEGER NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "selectedOptionId" INTEGER,
    "isCorrect" BOOLEAN NOT NULL,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "confidenceLevel" INTEGER,
    "responseTimeSecs" INTEGER,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "simulated_exam_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_experiences" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "experienceType" "ExperienceType" NOT NULL,
    "organizationName" TEXT NOT NULL,
    "location" TEXT,
    "supervisorName" TEXT,
    "supervisorContact" TEXT,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "totalHours" DOUBLE PRECISION,
    "description" TEXT,
    "skillsGained" TEXT,
    "reflections" TEXT,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinical_experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experience_sessions" (
    "id" SERIAL NOT NULL,
    "experienceId" INTEGER NOT NULL,
    "sessionDate" DATE NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "hoursLogged" DOUBLE PRECISION NOT NULL,
    "activitiesPerformed" TEXT,
    "notes" TEXT,
    "dateLogged" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experience_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extracurricular_activities" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "activityName" TEXT NOT NULL,
    "organization" TEXT,
    "rolePosition" TEXT,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "description" TEXT,
    "achievements" TEXT,
    "leadershipRole" BOOLEAN NOT NULL DEFAULT false,
    "reflections" TEXT,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extracurricular_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "courseCode" TEXT,
    "courseName" TEXT NOT NULL,
    "institution" TEXT,
    "semester" TEXT,
    "year" INTEGER,
    "gradeReceived" TEXT,
    "gradePoints" DECIMAL(3,2),
    "creditHours" DOUBLE PRECISION,
    "professorName" TEXT,
    "prereqType" "PrereqType",
    "completionStatus" "CompletionStatus" NOT NULL DEFAULT 'PLANNED',
    "personalNotes" TEXT,
    "dateAdded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_experiences" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "projectTitle" TEXT NOT NULL,
    "institution" TEXT,
    "labName" TEXT,
    "principalInvestigator" TEXT,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "researchArea" TEXT,
    "description" TEXT,
    "skillsGained" TEXT,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "research_experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_publications" (
    "id" SERIAL NOT NULL,
    "researchId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "journalName" TEXT,
    "publicationDate" DATE,
    "authorshipType" "AuthorshipType",
    "presentationType" "PresentationType" NOT NULL DEFAULT 'NONE',

    CONSTRAINT "research_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_mcat_topic_mastery" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "topicId" INTEGER NOT NULL,
    "masteryLevel" "MasteryLevel" NOT NULL,
    "notes" TEXT,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_mcat_topic_mastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_plans" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "planName" TEXT NOT NULL,
    "targetTestDate" DATE NOT NULL,
    "dailyGoalMins" INTEGER NOT NULL DEFAULT 120,
    "focusSubjects" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "study_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_plan_days" (
    "id" SERIAL NOT NULL,
    "planId" INTEGER NOT NULL,
    "scheduledDate" DATE NOT NULL,
    "subject" "Subject" NOT NULL,
    "topicId" INTEGER,
    "goalQuestions" INTEGER NOT NULL DEFAULT 20,
    "goalMins" INTEGER NOT NULL DEFAULT 60,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "study_plan_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "notificationType" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "streakReminder" BOOLEAN NOT NULL DEFAULT true,
    "dailyPractice" BOOLEAN NOT NULL DEFAULT true,
    "studyPlanCheckin" BOOLEAN NOT NULL DEFAULT true,
    "examApproaching" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "preferredTime" TIME,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "preferredDifficulty" INTEGER,
    "preferredSubjects" JSONB,
    "dailyQuestionGoal" INTEGER NOT NULL DEFAULT 40,
    "showExplanationsAfter" "ShowExplanationsAfter" NOT NULL DEFAULT 'IMMEDIATELY',
    "theme" "Theme" NOT NULL DEFAULT 'SYSTEM',
    "fontSize" "FontSize" NOT NULL DEFAULT 'MEDIUM',
    "timerVisible" BOOLEAN NOT NULL DEFAULT true,
    "targetScore" INTEGER,
    "targetTestDate" DATE,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_schools" (
    "id" SERIAL NOT NULL,
    "schoolName" TEXT NOT NULL,
    "locationCity" TEXT,
    "locationState" TEXT,
    "programType" "ProgramType" NOT NULL DEFAULT 'MD',
    "avgAcceptedMcat" INTEGER,
    "avgAcceptedGpa" DECIMAL(3,2),
    "amcasCode" TEXT,
    "websiteUrl" TEXT,

    CONSTRAINT "medical_schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_school_list" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "listCategory" "SchoolListCategory" NOT NULL DEFAULT 'TARGET',
    "applicationStatus" "ApplicationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "primarySubmittedDate" DATE,
    "secondarySubmittedDate" DATE,
    "interviewDate" DATE,
    "decisionDate" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_school_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_statement_drafts" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "draftTitle" TEXT NOT NULL DEFAULT 'Untitled draft',
    "statementType" "StatementType" NOT NULL DEFAULT 'PRIMARY',
    "schoolId" INTEGER,
    "promptText" TEXT,
    "content" TEXT,
    "wordCount" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "DraftStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personal_statement_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_statement_versions" (
    "id" SERIAL NOT NULL,
    "draftId" INTEGER NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "wordCount" INTEGER,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "personal_statement_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_streaks" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "currentStreakDays" INTEGER NOT NULL DEFAULT 0,
    "longestStreakDays" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" DATE,
    "streakStartedDate" DATE,
    "totalActiveDays" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_streaks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "question_topic_map_questionId_topicId_key" ON "question_topic_map"("questionId", "topicId");

-- CreateIndex
CREATE UNIQUE INDEX "question_bookmarks_userId_questionId_key" ON "question_bookmarks"("userId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_questions_quizId_questionId_key" ON "quiz_questions"("quizId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_practice_questions_practiceSetId_questionId_key" ON "daily_practice_questions"("practiceSetId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "simulated_exam_section_questions_sectionId_questionId_key" ON "simulated_exam_section_questions"("sectionId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_mcat_topic_mastery_userId_topicId_key" ON "user_mcat_topic_mastery"("userId", "topicId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_school_list_userId_schoolId_key" ON "user_school_list"("userId", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "user_streaks_userId_key" ON "user_streaks"("userId");

-- AddForeignKey
ALTER TABLE "score_analytics" ADD CONSTRAINT "score_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_analytics" ADD CONSTRAINT "score_analytics_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "question_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_analytics" ADD CONSTRAINT "score_analytics_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mcat_topics" ADD CONSTRAINT "mcat_topics_parentTopicId_fkey" FOREIGN KEY ("parentTopicId") REFERENCES "mcat_topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passages" ADD CONSTRAINT "passages_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "mcat_topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "passages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "question_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_topic_map" ADD CONSTRAINT "question_topic_map_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_topic_map" ADD CONSTRAINT "question_topic_map_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "mcat_topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_feedback" ADD CONSTRAINT "question_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_feedback" ADD CONSTRAINT "question_feedback_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_bookmarks" ADD CONSTRAINT "question_bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_bookmarks" ADD CONSTRAINT "question_bookmarks_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "question_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quiz_attempts" ADD CONSTRAINT "user_quiz_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quiz_attempts" ADD CONSTRAINT "user_quiz_attempts_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_answer_responses" ADD CONSTRAINT "user_answer_responses_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "user_quiz_attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_answer_responses" ADD CONSTRAINT "user_answer_responses_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_answer_responses" ADD CONSTRAINT "user_answer_responses_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "question_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_practice_sets" ADD CONSTRAINT "daily_practice_sets_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_practice_questions" ADD CONSTRAINT "daily_practice_questions_practiceSetId_fkey" FOREIGN KEY ("practiceSetId") REFERENCES "daily_practice_sets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_practice_questions" ADD CONSTRAINT "daily_practice_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulated_exam_sections" ADD CONSTRAINT "simulated_exam_sections_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "simulated_exam_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulated_exam_section_questions" ADD CONSTRAINT "simulated_exam_section_questions_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "simulated_exam_sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulated_exam_section_questions" ADD CONSTRAINT "simulated_exam_section_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_simulated_exam_attempts" ADD CONSTRAINT "user_simulated_exam_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_simulated_exam_attempts" ADD CONSTRAINT "user_simulated_exam_attempts_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "simulated_exam_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_simulated_section_results" ADD CONSTRAINT "user_simulated_section_results_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "user_simulated_exam_attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_simulated_section_results" ADD CONSTRAINT "user_simulated_section_results_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "simulated_exam_sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulated_exam_responses" ADD CONSTRAINT "simulated_exam_responses_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "user_simulated_exam_attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulated_exam_responses" ADD CONSTRAINT "simulated_exam_responses_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "simulated_exam_sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulated_exam_responses" ADD CONSTRAINT "simulated_exam_responses_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulated_exam_responses" ADD CONSTRAINT "simulated_exam_responses_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "question_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_experiences" ADD CONSTRAINT "clinical_experiences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experience_sessions" ADD CONSTRAINT "experience_sessions_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "clinical_experiences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extracurricular_activities" ADD CONSTRAINT "extracurricular_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_experiences" ADD CONSTRAINT "research_experiences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_publications" ADD CONSTRAINT "research_publications_researchId_fkey" FOREIGN KEY ("researchId") REFERENCES "research_experiences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mcat_topic_mastery" ADD CONSTRAINT "user_mcat_topic_mastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mcat_topic_mastery" ADD CONSTRAINT "user_mcat_topic_mastery_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "mcat_topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plan_days" ADD CONSTRAINT "study_plan_days_planId_fkey" FOREIGN KEY ("planId") REFERENCES "study_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plan_days" ADD CONSTRAINT "study_plan_days_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "mcat_topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_school_list" ADD CONSTRAINT "user_school_list_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_school_list" ADD CONSTRAINT "user_school_list_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "medical_schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_statement_drafts" ADD CONSTRAINT "personal_statement_drafts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_statement_drafts" ADD CONSTRAINT "personal_statement_drafts_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "medical_schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_statement_versions" ADD CONSTRAINT "personal_statement_versions_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "personal_statement_drafts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
