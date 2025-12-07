"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ChatListItem } from "@/components/chat-list-item";
import { DeleteChatDialog } from "@/components/delete-chat-dialog";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { chatsAtom, deleteChatAtom, updateChatTitleAtom } from "@/lib/atoms";

export function ChatList() {
  const chats = useAtomValue(chatsAtom);
  const { chatId } = useParams<{ chatId?: string }>();
  const router = useRouter();
  const deleteChat = useSetAtom(deleteChatAtom);
  const updateChatTitle = useSetAtom(updateChatTitleAtom);

  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const handleConfirmDelete = () => {
    if (chatToDelete) {
      if (chatToDelete === chatId) {
        router.push("/");
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
                isActive={chat.id === chatId}
                key={chat.id}
                onDelete={() => setChatToDelete(chat.id)}
                onEdit={(title) => updateChatTitle({ id: chat.id, title })}
                onSelect={() => router.push(`/chat/${chat.id}`)}
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
