"use client";

import { parseAsString, useQueryState } from "nuqs";

const chatIdParser = parseAsString.withDefault("");

export function useChatId() {
  return useQueryState("chat", chatIdParser);
}
