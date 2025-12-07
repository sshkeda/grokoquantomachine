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
    return "You are a backtesting agent. Use backtrader for simulations.";
  }
}
