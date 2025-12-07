"use client";

import { useChat } from "@ai-sdk/react";
import { useMutation } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useId, useRef } from "react";
import { generateTitle } from "@/app/actions/generate-title";
import ChatMessages from "@/components/chat-messages";
import PromptForm from "@/components/prompt-form";
import { useChatId } from "@/hooks/use-chat-id";
import {
  chatsAtom,
  createChatAtom,
  updateChatMessagesAtom,
  updateChatTitleAtom,
} from "@/lib/atoms";
import type { ModelId } from "@/lib/models";
import {
  type GenerateTitleVariables,
  generateTitleMutationKey,
} from "@/lib/mutations";
import type { BaseUIMessage } from "@/lib/types";

export default function Home() {
  const reactId = useId();
  const [currentChatId, setCurrentChatId] = useChatId();
  const chats = useAtomValue(chatsAtom);
  const createChat = useSetAtom(createChatAtom);
  const updateChatMessages = useSetAtom(updateChatMessagesAtom);
  const updateChatTitle = useSetAtom(updateChatTitleAtom);
  const newChatIdRef = useRef(`chat-${reactId}-${Date.now()}`);
  const chatId = currentChatId || newChatIdRef.current;
  const prevChatIdRef = useRef(currentChatId);

  const { messages, sendMessage, status, stop, setMessages } =
    useChat<BaseUIMessage>({
      id: chatId,
    });

  const generateTitleMutation = useMutation({
    mutationKey: generateTitleMutationKey,
    mutationFn: ({ prompt }: GenerateTitleVariables) => generateTitle(prompt),
    onSuccess: (title, { id }) => {
      updateChatTitle({ id, title });
    },
  });

  useEffect(() => {
    if (currentChatId && currentChatId !== prevChatIdRef.current) {
      const chat = chats.find((c) => c.id === currentChatId);
      if (chat) {
        setMessages(chat.messages);
      }
      prevChatIdRef.current = currentChatId;
    }
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
      generateTitleMutation.mutate({ prompt: text, id: chatId });
    }
    sendMessage({ text }, { body: { model } });
  };

  useEffect(() => {
    const previousChatId = prevChatIdRef.current;

    if (!currentChatId && previousChatId) {
      setMessages([]);
      newChatIdRef.current = `chat-${reactId}-${Date.now()}`;
    }
    prevChatIdRef.current = currentChatId;
  }, [currentChatId, setMessages, reactId]);

  return (
    <div className="flex max-h-screen min-h-screen w-full flex-col overflow-hidden">
      <div className="mx-auto flex max-h-screen min-h-screen w-full max-w-2xl flex-1 flex-col border-x">
        <ChatMessages messages={messages} status={status} />
        <PromptForm onSubmit={handleSendMessage} status={status} stop={stop} />
      </div>
    </div>
  );
}
