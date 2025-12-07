import { xai } from "@ai-sdk/xai";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  query: z.string(),
});

export async function POST(request: Request) {
  try {
    const { query } = schema.parse(await request.json());
    console.log("webSearch query:", query);

    const { text, sources } = await generateText({
      model: xai.responses("grok-4-1-fast-non-reasoning"),
      prompt: `Search the web for: "${query}". Provide a comprehensive summary of the search results.`,
      tools: {
        web_search: xai.tools.webSearch(),
      },
      abortSignal: AbortSignal.timeout(60_000), // 60 second timeout
    });

    console.log("webSearch completed, sources:", sources?.length ?? 0);
    return NextResponse.json({ text, sources });
  } catch (error) {
    console.error("webSearch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Web search failed" },
      { status: 500 }
    );
  }
}
