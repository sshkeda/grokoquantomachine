import { readFileSync } from "node:fs";
import { join } from "node:path";
import { type ToolCallOptions, tool } from "ai";
import { z } from "zod";
import { env } from "@/lib/env";
import type { StrategyChartData } from "@/lib/types";
import type { Context } from "../context";

const CHART_DATA_PATH = "/tmp/strategy_chart_data.json";

const searchPostsContent = readFileSync(
  join(process.cwd(), "app", "api", "chat", "workDir", "search_posts.py"),
  "utf-8"
);

const webSearchContent = readFileSync(
  join(process.cwd(), "app", "api", "chat", "workDir", "web_search.py"),
  "utf-8"
);

const getPricesContent = readFileSync(
  join(process.cwd(), "app", "api", "chat", "workDir", "get_prices.py"),
  "utf-8"
);

const testStrategyContent = readFileSync(
  join(process.cwd(), "app", "api", "chat", "workDir", "test_strategy.py"),
  "utf-8"
);

export const name = "executeCode";
export const description = `
Run Python code in a persistent Jupyter kernel. Variables, imports, and state persist across executions within the same sandbox.

The sandbox persists across messages - you can define a variable in one execution and use it in subsequent ones.

Use this tool only when you truly need to run code (for example, to fetch data, run a backtest, or perform calculations that are tedious or error-prone to do by hand). For conceptual questions, interpreting already-run results, or simple arithmetic, answer directly in chat instead of calling this tool.

Before each executeCode call, briefly plan what you will run and aim to cover all necessary work in that single execution; avoid "thinking by repeatedly calling" this tool.

Prefer a single self-contained code run per request (combine steps instead of multiple calls), except for research-style workflows.
For research-style tasks (e.g., "what happens if we trade around crashes/news/tweets?"), use two phases:
- First run code that gathers and summarizes the research (web_search, search_posts, simple calculations) and explain what it suggests.
- Then, if the idea still looks reasonable, use a separate executeCode call to build and run the actual backtest based on that research.

When you explain results back to the user, follow the chat persona defined in the system prompt:
- For "Stock Noob", keep explanations short, simple, and free of trading jargon.
- For "Quant Pro" and "Quant Pro Heavy", provide more detailed quantitative analysis and metrics while still keeping the answer well-structured and skimmable.
Avoid pasting full scripts in chat; keep most code inside the execution and only surface small, essential snippets if absolutely necessary.

## Available Functions

### search_posts - Search Twitter/X posts

\`\`\`python
from search_posts import search_posts

# Returns a list of Post objects with id, text, and created_at fields
posts = search_posts("from:elonmusk grok")
\`\`\`

### web_search - Search the web

\`\`\`python
from web_search import web_search

# Returns a WebSearchResult with text summary and sources list
result = web_search("latest AI news")
print(result.text)  # Summary of search results
print(result.sources)  # List of Source objects with url and title
\`\`\`

### get_prices - Fetch historical stock prices

\`\`\`python
from get_prices import get_prices

# Returns a pandas DataFrame indexed by timestamp with columns:
# Open, High, Low, Close, Volume
prices = get_prices("NVDA", "2024-01-01", "2024-12-01", interval="1d")
\`\`\`

### run_strategy - Backtrader helper

\`\`\`python
from test_strategy import run_strategy, StrategyResult
import backtrader as bt

# Define a Strategy subclass and let run_strategy handle cerebro setup
class MyStrategy(bt.Strategy):
    def next(self):
        if not self.position:
            self.buy(size=10)

# Use label parameter to identify each run when comparing multiple strategies
result: StrategyResult = run_strategy(MyStrategy, prices, initial_cash=25_000, label="My Strategy")
print(result)
\`\`\`

You can run multiple strategies in a single execution and each will generate its own chart:

\`\`\`python
result1 = run_strategy(Strategy1, prices, label="Conservative")
result2 = run_strategy(Strategy2, prices, label="Aggressive")
\`\`\`

## Implementation Details

### search_posts.py
\`\`\`python
${searchPostsContent}
\`\`\`

### web_search.py
\`\`\`python
${webSearchContent}
\`\`\`

### get_prices.py
\`\`\`python
${getPricesContent}
\`\`\`

### test_strategy.py
\`\`\`python
${testStrategyContent}
\`\`\`
`.trim();

type Input = z.infer<typeof inputSchema>;
export const inputSchema = z.object({
  code: z.string(),
  label: z
    .string()
    .describe(
      "A short, descriptive label explaining what this code execution does (e.g. 'Fetching NVDA prices', 'Running backtest', 'Searching recent tweets')"
    ),
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
      .join(""); // join "" preserves newlines in the log.data
    const stderr = this.logs
      .filter((log) => log.type === "stderr")
      .map((log) => log.data)
      .join("");

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
    timeoutMs: 5 * 60 * 1000, // 5 minutes
    onStdout: (output) => handleLog("stdout", output.line),
    onStderr: (output) => handleLog("stderr", output.line),
    onError: (error) =>
      handleLog("stderr", `${error.name}: ${error.value}\n${error.traceback}`),
    envs: { SANDBOX_API_URL: env.SANDBOX_API_URL, PYTHONUNBUFFERED: "1" },
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

  // Check for strategy chart data and emit it if present
  try {
    // E2B files.read() returns a string directly
    const chartDataContent = await sandbox.files.read(CHART_DATA_PATH);
    if (chartDataContent) {
      const chartDataArray = JSON.parse(
        chartDataContent
      ) as StrategyChartData[];
      for (const chartData of chartDataArray) {
        context.emitStrategyChart(chartData);
      }
      // Clean up the file after reading
      await sandbox.files.remove(CHART_DATA_PATH);
    }
  } catch {
    // File doesn't exist or couldn't be read - that's expected for non-strategy executions
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
