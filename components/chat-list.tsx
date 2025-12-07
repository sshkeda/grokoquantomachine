"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import { ChatListItem } from "@/components/chat-list-item";
import { DeleteChatDialog } from "@/components/delete-chat-dialog";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { useChatId } from "@/hooks/use-chat-id";
import { chatsAtom, deleteChatAtom, updateChatTitleAtom } from "@/lib/atoms";

export function ChatList() {
  const chats = useAtomValue(chatsAtom);
  const [currentChatId, setCurrentChatId] = useChatId();
  const deleteChat = useSetAtom(deleteChatAtom);
  const updateChatTitle = useSetAtom(updateChatTitleAtom);

  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const handleConfirmDelete = () => {
    if (chatToDelete) {
      // If deleting the current chat, navigate to new chat
      if (chatToDelete === currentChatId) {
        setCurrentChatId(null);
      }
      deleteChat(chatToDelete);
      setChatToDelete(null);
    }
  };

  const sortedChats = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Chats</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {sortedChats.map((chat) => (
              <ChatListItem
                chat={chat}
                isActive={chat.id === currentChatId}
                key={chat.id}
                onDelete={() => setChatToDelete(chat.id)}
                onEdit={(title) => updateChatTitle({ id: chat.id, title })}
                onSelect={() => setCurrentChatId(chat.id)}
              />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <DeleteChatDialog
        onConfirm={handleConfirmDelete}
        onOpenChange={(open) => {
          if (!open) {
            setChatToDelete(null);
          }
        }}
        open={!!chatToDelete}
      />
    </>
  );
}
