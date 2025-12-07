import { xai } from "@ai-sdk/xai";
import { convertToModelMessages, type streamText } from "ai";
import type { BaseUIMessage } from "@/lib/types";
import { Context } from "./context";
import type { ChatBody } from "./route";
import { executeCode } from "./tools/execute-code";

export type BaseTools = typeof tools;
const tools = {
  executeCode,
};

export function createAgent(body: ChatBody, request: Request) {
  const context = new Context();

  return {
    model: xai("grok-4-1-fast"),
    messages: convertToModelMessages<BaseUIMessage>(body.messages),
    abortSignal: request.signal,
    tools,
    prepareStep: () => ({
      system: context.getSystem(),
    }),
  } satisfies Parameters<typeof streamText<BaseTools>>[0];
}
