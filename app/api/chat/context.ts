import { Sandbox } from "@e2b/code-interpreter";
import type { UIMessageStreamWriter } from "ai";
import { env } from "@/lib/env";
import type { BaseUIMessage } from "@/lib/types";

export class Context {
  private sandbox: Sandbox | null = null;
  private persistedSandboxId: string | null = null;
  writer: UIMessageStreamWriter<BaseUIMessage> | null = null;

  constructor(messages: BaseUIMessage[]) {
    this.persistedSandboxId = this.extractLatestSandboxId(messages);
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
      requestTimeoutMs: 60_000, // 1 minute request timeout
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
      requestTimeoutMs: 60_000,
    });

    this.emitSandboxId(this.sandbox.sandboxId);

    return this.sandbox;
  }

  getSystem() {
    const now = new Date();
    return [
      `Current date and time: ${now.toLocaleString("en-US", { dateStyle: "full", timeStyle: "long" })}.`,
      "You are a backtesting agent. Prefer backtrader for simulations and portfolio logic.",
      "Use testStrategy.run_strategy to wire backtrader quickly—it sets up cerebro, commission, and a buy-and-hold benchmark for you.",
      "Avoid unnecessary print/log statements; only print concise, relevant results.",
      "Do as much work as possible in a single tool call instead of splitting execution unless safety or sequencing requires it (one combined code run > many steps).",
      "Keep the final text reply short, plain, and beginner-friendly—avoid trading jargon and summarize in simple terms.",
      "The sandbox already has these Python packages installed: backtrader, python-dotenv, httpx, pydantic, yfinance (and their dependencies like pandas, numpy, and requests). Use them without reinstalling.",
    ].join(" ");
  }
}
