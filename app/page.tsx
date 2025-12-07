"use client";

import ChatMessages from "@/components/chat-messages";
import PromptForm from "@/components/prompt-form";

export default function Home() {
  return (
    <main className="flex h-screen overflow-hidden">
      <div className="mx-auto flex max-h-screen w-full max-w-2xl flex-col">
        <ChatMessages />
        <PromptForm />
      </div>
    </main>
  );
}
