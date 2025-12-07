"use client";

import { useChat } from "@ai-sdk/react";
import ChatMessages from "@/components/chat-messages";
import PromptForm from "@/components/prompt-form";
import type { BaseUIMessage } from "@/lib/types";

export default function Home() {
  const { messages, sendMessage, status, stop } = useChat<BaseUIMessage>();
  return (
    <main className="flex max-h-screen min-h-screen overflow-hidden">
      <div className="mx-auto flex w-full max-w-2xl flex-col border-x">
        <ChatMessages messages={messages} status={status} />
        <PromptForm
          onSubmit={(message) => sendMessage({ text: message })}
          status={status}
          stop={stop}
        />
      </div>
    </main>
  );
}
