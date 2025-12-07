import { Sandbox } from "@e2b/code-interpreter";
import { tool } from "ai";
import { z } from "zod";
import { env } from "@/lib/env";

export const name = "executeCode";
export const description = `
Run Python code with uv in an isolated sandbox. Backtrader is available. Each call uses a fresh sandbox.
`.trim();

type Input = z.infer<typeof inputSchema>;
export const inputSchema = z.object({
  code: z.string(),
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

async function* executeExecuteCode(input: Input) {
  let sandbox: Sandbox | null = null;
  try {
    sandbox = await Sandbox.create(env.E2B_TEMPLATE_ALIAS, {
      timeoutMs: 60_000,
      requestTimeoutMs: 60_000,
    });

    const logTruncater = new LogTruncater();

    let notifyUpdate = () => {
      // Placeholder, reassigned by Promise executor
    };
    let nextUpdate = new Promise<void>((resolve) => {
      notifyUpdate = resolve;
    });

    const handleLog = (type: LogType, data: string) => {
      logTruncater.add(type, data);
      notifyUpdate();
    };

    const entrypoint = "main.py";
    await sandbox.files.write(entrypoint, input.code);

    const runCommand = `uv run ${entrypoint}`;
    const runCodePromise = sandbox.commands.run(runCommand, {
      onStdout: (data) => handleLog("stdout", data),
      onStderr: (data) => handleLog("stderr", data),
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

    await runCodePromise;

    return logTruncater.getFormatted();
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await sandbox?.kill();
  }
}

export const executeCode = tool<Input, Output>({
  name,
  description,
  inputSchema,
  outputSchema,
  execute: executeExecuteCode,
});
