// WHY: This is a Server Component that fetches the initial question bank data
// (questions, categories, topics) and passes them to Client Components for
// interactive filtering and pagination. Server Components are faster for the
// initial load because they don't need client-side JS to render the first frame.
//
// CONCEPT: We use Prisma directly here (not tRPC) because this is a Server
// Component that renders before any client-side interactivity. The Client
// Components use tRPC hooks for subsequent filter/paginate requests.
import { prisma } from "@/lib/prisma";
import { QuestionBankContent } from "./question-bank-content";

export const dynamic = "force-dynamic";

export default async function QuestionsPage() {
  // Fetch the first page of questions with their relations
  const [initialQuestions, categories, topics] = await Promise.all([
    prisma.question.findMany({
      where: { isActive: true },
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
      take: 20,
    }),
    prisma.questionCategory.findMany({
      where: { isActive: true },
      orderBy: { categoryName: "asc" },
    }),
    prisma.mcatTopic.findMany({
      where: { isActive: true },
      orderBy: [{ subject: "asc" }, { topicName: "asc" }],
    }),
  ]);

  const totalQuestions = await prisma.question.count({
    where: { isActive: true },
  });

  return (
    <QuestionBankContent
      initialQuestions={initialQuestions}
      initialTotal={totalQuestions}
      categories={categories}
      topics={topics}
    />
  );
}
