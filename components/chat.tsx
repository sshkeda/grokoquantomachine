"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { Sparkles } from "lucide-react";
import ChatMessages from "@/components/chat-messages";
import PromptForm from "@/components/prompt-form";
import { Button } from "@/components/ui/button";
import { DEFAULT_MODEL, type ModelId } from "@/lib/models";
import type { BaseUIMessage } from "@/lib/types";

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
    <div className="flex max-h-screen min-h-screen w-full flex-col overflow-hidden">
      <div className="mx-auto flex max-h-screen min-h-screen w-full max-w-2xl flex-1 flex-col border-x">
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
            <div className="grid w-full max-w-lg grid-cols-1 gap-2">
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
