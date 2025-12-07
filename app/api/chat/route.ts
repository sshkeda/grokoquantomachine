import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
} from "ai";
import z from "zod";
import { DEFAULT_MODEL, modelIdSchema } from "@/lib/models";
import type { BaseUIMessage } from "@/lib/types";
import { createAgent } from "./agent";

export type ChatBody = z.infer<typeof schema>;
const schema = z.object({
  id: z.string(),
  messages: z.array(z.any() as z.ZodType<BaseUIMessage>),
  model: modelIdSchema.optional().default(DEFAULT_MODEL),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());

  const stream = createUIMessageStream<BaseUIMessage>({
    execute: ({ writer }) => {
      const agent = createAgent(body, request, writer);
      writer.merge(streamText(agent).toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({ stream });
}
