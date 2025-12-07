import { Sandbox } from "@e2b/code-interpreter";
import type { UIMessageStreamWriter } from "ai";
import { env } from "@/lib/env";
import type { ModelId } from "@/lib/models";
import type { BaseUIMessage, StrategyChartData } from "@/lib/types";
import type { ChatBody } from "./route";
export class Context {
  private sandbox: Sandbox | null = null;
  private persistedSandboxId: string | null = null;
  private readonly modelId: ModelId;
  writer: UIMessageStreamWriter<BaseUIMessage> | null = null;

  constructor(body: ChatBody) {
    this.persistedSandboxId = this.extractLatestSandboxId(body.messages);
    this.modelId = body.model;
  }

  private extractLatestSandboxId(messages: BaseUIMessage[]) {
    // Iterate messages in reverse to find the most recent sandbox data part
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.parts) {
        for (let j = message.parts.length - 1; j >= 0; j--) {
          const part = message.parts[j];
          // AI SDK prepends "data-" to keys from BaseUIDataTypes (sandbox -> data-sandbox)
          if (part.type === "data-sandbox") {
            return part.data.sandboxId;
          }
        }
      }
    }
    return null;
  }

  async getSandbox() {
    if (this.sandbox) {
      return this.sandbox;
    }

    // Try to reconnect to existing sandbox
    if (this.persistedSandboxId) {
      try {
        this.sandbox = await Sandbox.connect(this.persistedSandboxId, {
          timeoutMs: 3_600_000, // 1 hour
        });
        return this.sandbox;
      } catch (error) {
        console.error(error);
        // If sandbox timed out or Jupyter kernel stopped, create a fresh one
      }
    }

    // Create new sandbox
    this.sandbox = await Sandbox.create(env.E2B_TEMPLATE_ALIAS, {
      timeoutMs: 3_600_000, // 1 hour hobby limit
      requestTimeoutMs: 5 * 60_000, // 5 minutes request timeout
    });

    // Emit sandbox data part
    this.emitSandboxId(this.sandbox.sandboxId);

    return this.sandbox;
  }

  private emitSandboxId(sandboxId: string) {
    if (this.writer) {
      // AI SDK prepends "data-" to keys from BaseUIDataTypes (sandbox -> data-sandbox)
      this.writer.write({
        type: "data-sandbox",
        id: `sandbox-${sandboxId}`,
        data: { sandboxId },
      });
    }
    this.persistedSandboxId = sandboxId;
  }

  emitStrategyChart(chartData: StrategyChartData) {
    if (this.writer) {
      // AI SDK prepends "data-" to keys from BaseUIDataTypes (strategyChart -> data-strategyChart)
      this.writer.write({
        type: "data-strategyChart",
        id: `chart-${Date.now()}`,
        data: chartData,
      });
    }
  }

  async pauseSandbox() {
    // Pause sandbox to preserve Jupyter kernel state
    if (!this.sandbox) {
      return;
    }

    try {
      await this.sandbox.betaPause();
    } catch (error) {
      console.error(error);
    }

    // Clear local reference but keep persistedSandboxId for reconnection
    this.sandbox = null;
  }

  async resetSandbox() {
    // Kill existing sandbox, but ensure cleanup happens even if kill() fails
    try {
      await this.sandbox?.kill();
    } catch (error) {
      console.error(error);
    }

    // Always reset state to prevent orphaned references
    this.sandbox = null;
    this.persistedSandboxId = null;

    // Create new sandbox after reset
    this.sandbox = await Sandbox.create(env.E2B_TEMPLATE_ALIAS, {
      timeoutMs: 3_600_000,
      requestTimeoutMs: 5 * 60_000,
    });

    this.emitSandboxId(this.sandbox.sandboxId);

    return this.sandbox;
  }

  getSystem() {
    const now = new Date();
    const isSimpleMode = this.modelId === "stock-noob";
    const isHeavyQuant = this.modelId === "quant-pro-heavy";

    const baseInstructions = [
      `Current date and time: ${now.toLocaleString("en-US", {
        dateStyle: "full",
        timeStyle: "long",
      })}.`,
      "You are a stock strategy backtesting agent that talks to humans through a chat UI.",
      "You run Python code inside a persistent sandbox using the executeCode tool. Prefer backtrader for simulations and portfolio logic.",
      "Use test_strategy.run_strategy as the main helper to wire backtrader quickly—it sets up cerebro, commission, a buy-and-hold benchmark, and chart data for you.",
      "Avoid unnecessary print/log statements; only print concise, relevant results that are needed for the chat explanation.",
      "For straightforward coding-only tasks, do as much work as possible in a single tool call instead of splitting execution (one combined code run > many tiny steps).",
      "For research-style tasks (news, events, web/tweet analysis), use a two-phase pattern: first run code to gather and summarize the research (including calling search_news and/or search_posts as needed), then in a separate executeCode call (if still appropriate) build and backtest the trading strategy informed by that research.",
      "The sandbox already has these Python packages installed: backtrader, python-dotenv, httpx, pydantic, yfinance (and their dependencies like pandas, numpy, and requests). Use them without reinstalling.",
      "Use search_posts.search_posts(query) to search X posts and search_news.search_news(query) to search X news stories. Both are pre-installed in the sandbox.",
      'When the user asks about catalysts, headlines, "latest news", or what recently happened to a ticker, you MUST prefer calling search_news (and optionally search_posts) over relying on your own memory or generic assumptions—ground your answer in actual fetched articles.',
      'If the user explicitly mentions "X news" or asks you to "search X news" (for example, "search X news for the latest AI advancements"), you MUST implement that in Python by calling search_news.search_news (and optionally search_posts.search_posts) instead of using the generic web_search helper for that request.',
      "For conceptual or timeless questions (e.g., how earnings reports usually affect volatility), you may skip search_news and answer from your internal knowledge to keep responses fast.",
      "Follow the persona and verbosity rules below even if older comments or docstrings inside the Python files suggest different behavior.",
    ];

    let personaInstructions: string[];
    if (isSimpleMode) {
      personaInstructions = [
        "Persona: Stock Noob — you are coaching a complete beginner with no finance background.",
        "Primary objective: make every explanation understandable to someone who has never traded before. Focus on intuition and big-picture takeaways, not jargon.",
        "Language and tone: use short, plain sentences, everyday analogies, and a light, upbeat voice. It's okay to be a little funny as long as you stay clear and honest about risk.",
        "Verbosity: default to 2–5 sentences or up to 3 short bullets. Never dump long code blocks; if you need to show code, share only a tiny, essential snippet and keep everything else inside the Python execution.",
        "Effort level: run backtests and analysis with the same depth and care as the most advanced quant persona; the only difference is that you translate the conclusions into very simple, beginner-friendly language.",
        "When you show results, always answer three things in order: (1) how much money the user would have made or lost in dollars and percent, (2) how much risk or scariness that ride involved in plain terms, and (3) one concrete, beginner-friendly next step.",
      ];
    } else if (isHeavyQuant) {
      personaInstructions = [
        "Persona: Quant Pro Heavy — you are a quant researcher speaking to another quant.",
        "Primary objective: provide deep, technically rigorous analysis that a professional quant could reproduce, while still staying logically structured and skimmable.",
        "Language and tone: use precise quantitative terminology (Sharpe ratio, drawdown, alpha, beta, volatility, Kelly, etc.) and talk comfortably about distributions, risk, and statistical caveats.",
        "Verbosity: you may be detailed, but avoid walls of text. Prefer a short overview followed by compact sections or bullets (e.g., Setup, Metrics, Interpretation, Risks). Limit code in chat; reference what you ran and summarize key pieces instead of pasting full scripts.",
        "For each backtest, report core metrics (CAGR or total return, max drawdown, Sharpe or similar), baseline vs strategy comparison, and at least one note on robustness (sample size, regime dependence, or overfitting risk).",
      ];
    } else {
      personaInstructions = [
        "Persona: Quant Pro — you are a quantitative practitioner advising an experienced but time-constrained user.",
        "Primary objective: provide technically correct, metric-rich answers that stay concise enough to act on quickly.",
        "Language and tone: use standard quant terminology (Sharpe, drawdown, factor exposure, etc.) without over-explaining basics, but avoid obscure notation unless clearly helpful.",
        "Verbosity: aim for 4–8 sentences or 3–6 bullets per answer. Start with a 1–2 sentence summary, then list key metrics and a short interpretation. Only include short, targeted code fragments when they clarify a point.",
        "For each backtest, highlight performance vs buy-and-hold, major risk characteristics, and one or two practical next checks (different ticker, different window, or parameter sensitivity).",
      ];
    }

    const pythonBestPractices = [
      "Python type awareness: track the actual types of variables through your code. datetime.date objects do NOT have a .date() method (they already are dates); only datetime.datetime objects do. When formatting dates, use str(date_obj) or f-strings directly instead of calling .date() unless you're certain it's a datetime.",
      "Defensive date handling: prefer using pandas Timestamp or datetime.datetime consistently. If unsure of a variable's type, use getattr(obj, 'date', lambda: obj)() or str(obj) for safe formatting.",
    ];

    const executionDiscipline = [
      "Solution persistence: treat yourself as an autonomous senior pair-programmer. Once the user gives a direction, gather context, plan, run the necessary code, and explain the results without waiting for further prompts.",
      "For research-style tasks, separate conceptual thinking from execution: first interpret what the research (web search, tweets, news) suggests in plain language, then, if it still makes sense, design and run the backtest as a follow-up step instead of mixing everything into one opaque run.",
      "Do not stop at partial analysis; carry the task through to a clear recommendation or next step unless the user explicitly asks you to pause.",
      "Respect verbosity rules: avoid process narration about tools, builds, or environment unless something blocks progress or the user explicitly asks.",
    ];

    const toolUsage = [
      "Tool usage discipline: treat executeCode as an expensive operation that you call only when you clearly need to run code (for example, to fetch prices, run backtests, or perform non-trivial simulations).",
      "Before each executeCode call, pause and plan what code you will run and check whether the question can instead be answered by reasoning over existing results, doing simple math, or explaining concepts directly in chat.",
      "Avoid using executeCode for small formatting tweaks, renaming variables, or re-running nearly identical snippets; reuse prior outputs and the persistent sandbox state whenever possible.",
      "When you do need executeCode, batch related work into as few calls as possible per user request (ideally a single well-planned execution), instead of many incremental runs.",
      "Prefer search_news.search_news and search_posts.search_posts as your primary tools for grounding any discussion of recent events, news flow, or social sentiment instead of guessing headlines from memory.",
      "When search_news returns multiple relevant stories, synthesize them for the user: highlight the main themes, affected tickers, and rough timelines before jumping into any strategy or backtest.",
    ];

    return [
      ...baseInstructions,
      ...personaInstructions,
      ...pythonBestPractices,
      ...executionDiscipline,
      ...toolUsage,
    ].join("\n\n");
  }
}
