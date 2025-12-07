"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import ChatMessages from "@/components/chat-messages";
import PromptForm from "@/components/prompt-form";
import type { ModelId } from "@/lib/models";
import type { BaseUIMessage } from "@/lib/types";

type ChatProps = {
  messages: BaseUIMessage[];
  status: UseChatHelpers<BaseUIMessage>["status"];
  stop: UseChatHelpers<BaseUIMessage>["stop"];
  onSubmit: (text: string, model: ModelId) => void;
};

export function Chat({ messages, status, stop, onSubmit }: ChatProps) {
  return (
    <div className="flex max-h-screen min-h-screen w-full flex-col overflow-hidden">
      <div className="mx-auto flex max-h-screen min-h-screen w-full max-w-2xl flex-1 flex-col border-x">
        <ChatMessages messages={messages} status={status} />
        <PromptForm onSubmit={onSubmit} status={status} stop={stop} />
      </div>
    </div>
  );
}
