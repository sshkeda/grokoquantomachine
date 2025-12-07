"use client";

import { useChat } from "@ai-sdk/react";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useId, useRef } from "react";
import ChatMessages from "@/components/chat-messages";
import PromptForm from "@/components/prompt-form";
import { useChatId } from "@/hooks/use-chat-id";
import { chatsAtom, createChatAtom, updateChatMessagesAtom } from "@/lib/atoms";
import type { ModelId } from "@/lib/models";
import type { BaseUIMessage } from "@/lib/types";

export default function Home() {
  const reactId = useId();
  const [currentChatId, setCurrentChatId] = useChatId();
  const chats = useAtomValue(chatsAtom);
  const createChat = useSetAtom(createChatAtom);
  const updateChatMessages = useSetAtom(updateChatMessagesAtom);
  const chatId = currentChatId || `chat-${reactId}`;
  const prevChatIdRef = useRef(currentChatId);

  const { messages, sendMessage, status, stop, setMessages } =
    useChat<BaseUIMessage>({
      id: chatId,
    });

  useEffect(() => {
    if (currentChatId && currentChatId !== prevChatIdRef.current) {
      const chat = chats.find((c) => c.id === currentChatId);
      if (chat) {
        setMessages(chat.messages);
      }
    }
    prevChatIdRef.current = currentChatId;
  }, [currentChatId, chats, setMessages]);

  useEffect(() => {
    if (messages.length > 0 && currentChatId) {
      updateChatMessages({ id: currentChatId, messages });
    }
  }, [messages, currentChatId, updateChatMessages]);

  const handleSendMessage = (text: string, model: ModelId) => {
    if (!currentChatId) {
      createChat(chatId);
      setCurrentChatId(chatId);
    }
    sendMessage({ text }, { body: { model } });
  };

  useEffect(() => {
    if (!currentChatId) {
      setMessages([]);
    }
  }, [currentChatId, setMessages]);

  return (
    <div className="flex max-h-screen min-h-screen w-full flex-col overflow-hidden">
      <div className="mx-auto flex max-h-screen min-h-screen w-full max-w-2xl flex-1 flex-col border-x">
        <ChatMessages messages={messages} status={status} />
        <PromptForm onSubmit={handleSendMessage} status={status} stop={stop} />
      </div>
    </div>
  );
}
