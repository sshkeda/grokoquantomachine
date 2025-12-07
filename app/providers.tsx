"use client";

import { Provider as JotaiProvider } from "jotai";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <JotaiProvider>
      <NuqsAdapter>{children}</NuqsAdapter>
    </JotaiProvider>
  );
}
