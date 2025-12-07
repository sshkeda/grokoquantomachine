import { readFileSync } from "node:fs";
import { join } from "node:path";
import { type ToolCallOptions, tool } from "ai";
import { z } from "zod";
import { env } from "@/lib/env";
import type { Context } from "../context";

const searchPostsContent = readFileSync(
  join(process.cwd(), "app", "api", "chat", "workDir", "searchPosts.py"),
  "utf-8"
);

export const name = "executeCode";
export const description = `
Run Python code in a persistent Jupyter kernel. Variables, imports, and state persist across executions within the same sandbox.

The sandbox persists across messages - you can define a variable in one execution and use it in subsequent ones.

You can import and use the \`search_posts\` function to search Twitter/X posts:

\`\`\`python
from searchPosts import search_posts

# Returns a list of Post objects with id, text, and created_at fields
posts = search_posts("from:TwitterDev has:media -is:retweet")
\`\`\`

Available types and implementation:

\`\`\`python
${searchPostsContent}
\`\`\`
`.trim();

type Input = z.infer<typeof inputSchema>;
export const inputSchema = z.object({
  code: z.string(),
  reset: z
    .boolean()
    .optional()
    .describe("Reset sandbox to fresh state before running"),
});

type Output = z.infer<typeof outputSchema>;
export const outputSchema = z.object({
  stderr: z.string().describe("Stderr logs from the program run."),
  stdout: z.string().describe("Stdout logs from the program run."),
});
const TRUNCATE_CHAR_LIMIT = 67_420;

type LogType = "stdout" | "stderr";
class LogTruncater {
  private readonly logs: { type: LogType; data: string }[] = [];

  add(type: LogType, data: string) {
    this.logs.push({ type, data });
  }

  private truncate(text: string): string {
    if (text.length <= TRUNCATE_CHAR_LIMIT) {
      return text;
    }
    return `[...truncated to last ${TRUNCATE_CHAR_LIMIT} characters...]\n${text.slice(-TRUNCATE_CHAR_LIMIT)}`;
  }

  getFormatted(): Output {
    const stdout = this.logs
      .filter((log) => log.type === "stdout")
      .map((log) => log.data)
      .join("\n");
    const stderr = this.logs
      .filter((log) => log.type === "stderr")
      .map((log) => log.data)
      .join("\n");

    return {
      stdout: this.truncate(stdout),
      stderr: this.truncate(stderr),
    };
  }
}

async function* executeExecuteCode(input: Input, options: ToolCallOptions) {
  const context = options.experimental_context as Context;
  const sandbox = input.reset
    ? await context.resetSandbox()
    : await context.getSandbox();
  const logTruncater = new LogTruncater();

  let notifyUpdate: () => void;
  let nextUpdate = new Promise<void>((resolve) => {
    notifyUpdate = resolve;
  });

  const handleLog = (type: LogType, data: string) => {
    logTruncater.add(type, data);
    notifyUpdate();
  };

  const runCodePromise = sandbox.runCode(input.code, {
    onStdout: (msg) => handleLog("stdout", msg.line),
    onStderr: (msg) => handleLog("stderr", msg.line),
    envs: { SANDBOX_API_URL: env.SANDBOX_API_URL },
  });

  let isFinished = false;
  runCodePromise.finally(() => {
    isFinished = true;
    notifyUpdate();
  });

  while (!isFinished) {
    await nextUpdate;
    nextUpdate = new Promise<void>((resolve) => {
      notifyUpdate = resolve;
    });
    yield logTruncater.getFormatted();
  }

  const execution = await runCodePromise;

  if (execution.error) {
    logTruncater.add(
      "stderr",
      `${execution.error.name}: ${execution.error.value}\n${execution.error.traceback}`
    );
  }

  return logTruncater.getFormatted();
}

export const executeCode = tool<Input, Output>({
  name,
  description,
  inputSchema,
  outputSchema,
  execute: executeExecuteCode,
});
