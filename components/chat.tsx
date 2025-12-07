"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { Sparkles, Zap } from "lucide-react";
import ChatMessages from "@/components/chat-messages";
import PromptForm from "@/components/prompt-form";
import { Button } from "@/components/ui/button";
import { DEFAULT_MODEL, type ModelId } from "@/lib/models";
import type { BaseUIMessage } from "@/lib/types";

const RANDOM_STRATEGY_PROMPT =
  "Search for today's top financial news and trending topics, then create a unique and creative trading strategy based on what you find. Be creative with the entry/exit signals and pick interesting tickers that relate to the news.";

const PROMPT_IDEAS = [
  "Backtest buying TSLA whenever Elon Musk tweets about rockets or Mars",
  "Backtest shorting meme stocks when wallstreetbets tweet volume spikes 3x",
  "Backtest buying NVDA when Jensen Huang tweets about AI breakthroughs",
  "Backtest buying Bitcoin when Michael Saylor tweets about buying more BTC",
];

type ChatProps = {
  messages: BaseUIMessage[];
  status: UseChatHelpers<BaseUIMessage>["status"];
  stop: UseChatHelpers<BaseUIMessage>["stop"];
  onSubmit: (text: string, model: ModelId) => void;
};

export function Chat({ messages, status, stop, onSubmit }: ChatProps) {
  const isEmpty = messages.length === 0;

  return (
    <div className="flex max-h-dvh min-h-dvh w-full flex-col overflow-hidden">
      <div className="mx-auto flex max-h-dvh min-h-dvh w-full max-w-2xl flex-1 flex-col border-x">
        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-8 p-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <Sparkles className="size-10 text-muted-foreground" />
              <h1 className="font-semibold text-2xl">
                What would you like to explore?
              </h1>
              <p className="text-muted-foreground text-sm">
                Backtest trading strategies on your favorite stocks
              </p>
            </div>

            <button
              className="group relative w-full max-w-lg overflow-hidden rounded-xl bg-linear-to-r from-violet-600 via-fuchsia-500 to-pink-500 p-[2px] shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-fuchsia-500/25 hover:shadow-xl active:scale-[0.98]"
              onClick={() => onSubmit(RANDOM_STRATEGY_PROMPT, DEFAULT_MODEL)}
              type="button"
            >
              <div className="relative flex items-center justify-center gap-3 rounded-[10px] bg-background px-6 py-4 transition-colors group-hover:bg-background/80">
                <div className="absolute inset-0 rounded-[10px] bg-linear-to-r from-violet-600/10 via-fuchsia-500/10 to-pink-500/10 opacity-0 transition-opacity group-hover:opacity-100" />
                <Zap className="size-5 text-fuchsia-500 transition-transform group-hover:scale-110" />
                <div className="flex flex-col items-start gap-0.5">
                  <span className="font-semibold text-foreground">
                    Generate Random Strategy
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Create a unique strategy based on today's news
                  </span>
                </div>
              </div>
            </button>

            <div className="flex w-full max-w-lg flex-col gap-2">
              <p className="text-muted-foreground text-xs">
                Or try one of these:
              </p>
              {PROMPT_IDEAS.map((prompt) => (
                <Button
                  className="h-auto whitespace-normal px-4 py-3 text-left"
                  key={prompt}
                  onClick={() => onSubmit(prompt, DEFAULT_MODEL)}
                  variant="outline"
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <ChatMessages messages={messages} status={status} />
        )}
        <PromptForm onSubmit={onSubmit} status={status} stop={stop} />
      </div>
    </div>
  );
}
