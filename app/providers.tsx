"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <NuqsAdapter>{children}</NuqsAdapter>
      </JotaiProvider>
    </QueryClientProvider>
  );
}
