"use client";

import ChatMessages from "@/components/chat-messages";
import PromptForm from "@/components/prompt-form";

export default function Home() {
  return (
    <main className="flex h-screen overflow-hidden">
      <div className="max-w-2xl mx-auto flex w-full flex-col max-h-screen">
        <ChatMessages />
        <PromptForm />
      </div>
    </main>
  );
}
