"use server";

import { xai } from "@ai-sdk/xai";
import { generateText } from "ai";

export async function generateTitle(prompt: string): Promise<string> {
  const { text } = await generateText({
    model: xai("grok-4-1-fast-non-reasoning"),
    system:
      "Generate a short, concise title (3-6 words) for a chat conversation based on the user's first message. Return only the title, nothing else. No quotes, no punctuation at the end.",
    prompt: `User's message: ${prompt}`,
  });

  return text.trim();
}
