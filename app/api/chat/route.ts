import { streamText } from "ai";
import z from "zod";
import type { BaseUIMessage } from "@/lib/types";
import { createAgent } from "./agent";

export type ChatBody = z.infer<typeof schema>;
const schema = z.object({
  messages: z.array(z.any() as z.ZodType<BaseUIMessage>),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());

  const agent = createAgent(body, request);
  return streamText(agent).toUIMessageStreamResponse();
}
