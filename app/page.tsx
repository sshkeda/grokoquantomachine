"use client";

import { useChat } from "@ai-sdk/react";
import ChatMessages from "@/components/chat-messages";
import PromptForm from "@/components/prompt-form";
import type { BaseUIMessage } from "@/lib/types";

export default function Home() {
  const { messages, sendMessage, status, stop } = useChat<BaseUIMessage>();
  return (
    <div className="flex max-h-screen min-h-screen w-full flex-col overflow-hidden">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col border-x">
        <ChatMessages messages={messages} status={status} />
        <PromptForm
          onSubmit={(message) => sendMessage({ text: message })}
          status={status}
          stop={stop}
        />
      </div>
    </div>
  );
}
