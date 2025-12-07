import { xai } from "@ai-sdk/xai";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  query: z.string(),
});

export async function POST(request: Request) {
  const { query } = schema.parse(await request.json());

  const { text, sources } = await generateText({
    model: xai.responses("grok-4-1-fast-non-reasoning"),
    prompt: `Search the web for: "${query}". Provide a comprehensive summary of the search results.`,
    tools: {
      web_search: xai.tools.webSearch(),
    },
  });

  return NextResponse.json({ text, sources });
}
