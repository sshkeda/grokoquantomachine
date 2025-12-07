import { xai } from "@ai-sdk/xai";
import { convertToModelMessages, type streamText } from "ai";
import type { BaseUIMessage, BaseUITools } from "@/lib/types";
import type { ChatBody } from "./route";

export function createAgent(body: ChatBody, request: Request) {
  return {
    model: xai("grok-4-fast-non-reasoning"),
    messages: convertToModelMessages<BaseUIMessage>(body.messages),
    abortSignal: request.signal,
  } satisfies Parameters<typeof streamText<BaseUITools>>[0];
}
