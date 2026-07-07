"use client";

import { api } from "@/lib/trpc/client";

/**
 * Health-check page — verifies end-to-end connectivity from the
 * browser through tRPC → Prisma → PostgreSQL by calling the
 * `dbCheck` procedure which runs a trivial `SELECT COUNT(*)`.
 */
export default function Home() {
  const dbQuery = api.health.dbCheck.useQuery(undefined, {
    retry: 1,
    retryDelay: 500,
  });

  if (dbQuery.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-zinc-500">⏳ Checking database connection…</p>
      </main>
    );
  }

  if (dbQuery.isError) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950">
          <p className="text-lg font-medium text-red-600">
            ❌ Database connection failed
          </p>
          <pre className="mt-2 overflow-x-auto text-sm text-red-500">
            {dbQuery.error?.message}
          </pre>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-900 dark:bg-green-950">
        <p className="text-lg font-medium text-green-600">
          ✅ Database connected — {dbQuery.data?.userCount} users
        </p>
      </div>
    </main>
  );
}
