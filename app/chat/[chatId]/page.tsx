"use client";

import { useChat } from "@ai-sdk/react";
import { useMutation } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useEffect, useRef } from "react";
import { generateTitle } from "@/app/actions/generate-title";
import { Chat } from "@/components/chat";
import {
  chatsAtom,
  createChatAtom,
  updateChatMessagesAtom,
  updateChatTitleAtom,
} from "@/lib/atoms";
import { DEFAULT_MODEL, type ModelId, modelIdSchema } from "@/lib/models";
import {
  type GenerateTitleVariables,
  generateTitleMutationKey,
} from "@/lib/mutations";
import type { BaseUIMessage } from "@/lib/types";

export default function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const chats = useAtomValue(chatsAtom);
  const createChat = useSetAtom(createChatAtom);
  const updateChatMessages = useSetAtom(updateChatMessagesAtom);
  const updateChatTitle = useSetAtom(updateChatTitleAtom);
  const initializedRef = useRef(false);
  const chat = chats.find((c) => c.id === chatId);
  const { messages, sendMessage, status, stop, setMessages } =
    useChat<BaseUIMessage>({ id: chatId });

  const titleMutation = useMutation({
    mutationKey: generateTitleMutationKey,
    mutationFn: ({ prompt }: GenerateTitleVariables) => generateTitle(prompt),
    onSuccess: (title, { id }) => updateChatTitle({ id, title }),
  });

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }
    if (chat?.messages.length) {
      setMessages(chat.messages);
      initializedRef.current = true;
      return;
    }
    const prompt = searchParams.get("prompt");
    const model = modelIdSchema
      .catch(DEFAULT_MODEL)
      .parse(searchParams.get("model"));
    if (!chat) {
      createChat(chatId);
    }
    if (prompt) {
      initializedRef.current = true;
      titleMutation.mutate({ prompt, id: chatId });
      sendMessage({ text: prompt }, { body: { model } });
      router.replace(`/chat/${chatId}`);
    }
  }, [
    chat,
    chatId,
    createChat,
    router,
    searchParams,
    sendMessage,
    setMessages,
    titleMutation,
  ]);

  useEffect(() => {
    if (initializedRef.current && messages.length > 0) {
      updateChatMessages({ id: chatId, messages });
    }
  }, [messages, chatId, updateChatMessages]);

  const handleSendMessage = (text: string, model: ModelId) => {
    initializedRef.current = true;
    if (chat?.title === "New Chat") {
      titleMutation.mutate({ prompt: text, id: chatId });
    }
    sendMessage({ text }, { body: { model } });
  };

  return (
    <Chat
      messages={messages}
      onSubmit={handleSendMessage}
      status={status}
      stop={stop}
    />
  );
}
