"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, splitLink } from "@trpc/client";
import React, { useState } from "react";
import { api } from "@/lib/trpc/client";
import superjson from "superjson";

/**
 * tRPC + React Query provider — wrap at the app root level.
 * Creates a dedicated QueryClient per render to avoid cross-request state leakage.
 */
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 min
            retry: 1,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpBatchLink({
          url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/trpc`,
          transformer: superjson,
          async headers() {
            // Optionally attach auth headers here later
            return {};
          },
        }),
      ],
    })
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  );
}
