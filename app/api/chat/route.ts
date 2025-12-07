import { xai } from "@ai-sdk/xai";
import { convertToModelMessages, streamText } from "ai";
import z from "zod";
import type { BaseUIMessage } from "@/lib/types";

const schema = z.object({
  messages: z.array(z.any() as z.ZodType<BaseUIMessage>),
});

export async function POST(request: Request) {
  const { messages } = schema.parse(await request.json());
  const response = streamText({
    model: xai("grok-4-fast-non-reasoning"),
    messages: convertToModelMessages<BaseUIMessage>(messages),
  });

  return response.toUIMessageStreamResponse();
}
