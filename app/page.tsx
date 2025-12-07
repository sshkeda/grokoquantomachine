"use client";

import { useChat } from "@ai-sdk/react";
import ChatMessages from "@/components/chat-messages";
import PromptForm from "@/components/prompt-form";
import type { BaseUIMessage } from "@/lib/types";

export default function Home() {
  const { messages, sendMessage } = useChat<BaseUIMessage>();
  return (
    <main className="flex h-screen overflow-hidden">
      <div className="mx-auto flex max-h-screen w-full max-w-2xl flex-col border-x">
        <ChatMessages messages={messages} />
        <PromptForm onSubmit={(message) => sendMessage({ text: message })} />
      </div>
    </main>
  );
}
