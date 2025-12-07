"use client";

import { useQueryState } from "nuqs";
import { chatIdParser } from "@/lib/search-params";

export function useChatId() {
  return useQueryState("chat", chatIdParser);
}
