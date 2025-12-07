"use client";

import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { BaseUIMessage } from "./types";

export type Chat = {
  id: string;
  title: string;
  messages: BaseUIMessage[];
  createdAt: number;
  updatedAt: number;
};

// Persisted atom for all chats
export const chatsAtom = atomWithStorage<Chat[]>("chats", []);

// Action atoms
export const createChatAtom = atom(null, (get, set, id: string) => {
  const chats = get(chatsAtom);
  const existingChat = chats.find((chat) => chat.id === id);
  if (existingChat) {
    return existingChat;
  }
  const newChat: Chat = {
    id,
    title: "New Chat",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  set(chatsAtom, [...chats, newChat]);
  return newChat;
});

export const deleteChatAtom = atom(null, (get, set, id: string) => {
  const chats = get(chatsAtom);
  set(
    chatsAtom,
    chats.filter((chat) => chat.id !== id)
  );
});

export const updateChatTitleAtom = atom(
  null,
  (get, set, { id, title }: { id: string; title: string }) => {
    const chats = get(chatsAtom);
    const index = chats.findIndex((chat) => chat.id === id);
    if (index !== -1) {
      const newChats = [...chats];
      newChats[index] = {
        ...newChats[index],
        title,
        updatedAt: Date.now(),
      };
      set(chatsAtom, newChats);
    }
  }
);

export const updateChatMessagesAtom = atom(
  null,
  (get, set, { id, messages }: { id: string; messages: BaseUIMessage[] }) => {
    const chats = get(chatsAtom);
    const index = chats.findIndex((chat) => chat.id === id);
    if (index !== -1) {
      const newChats = [...chats];
      const currentChat = newChats[index];
      const shouldUpdateTimestamp =
        messages.length > currentChat.messages.length;
      newChats[index] = {
        ...currentChat,
        messages,
        ...(shouldUpdateTimestamp && { updatedAt: Date.now() }),
      };
      set(chatsAtom, newChats);
    }
  }
);
