"use client";

import { useRouter } from "next/navigation";
import { useId } from "react";
import { Chat } from "@/components/chat";
import type { ModelId } from "@/lib/models";

export default function Home() {
  const router = useRouter();
  const reactId = useId();

  const handleSendMessage = (text: string, model: ModelId) => {
    const chatId = `chat-${reactId}-${Date.now()}`;
    const params = new URLSearchParams({ prompt: text, model });
    router.push(`/chat/${chatId}?${params}`);
  };

  return (
    <Chat
      messages={[]}
      onSubmit={handleSendMessage}
      status="ready"
      stop={async () => {
        // no-op
      }}
    />
  );
}
