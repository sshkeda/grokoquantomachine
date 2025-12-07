"use client";

import { MessageSquare, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { EditChatTitleForm } from "@/components/edit-chat-title-form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { Chat } from "@/lib/atoms";

type ChatListItemProps = {
  chat: Chat;
  isActive: boolean;
  onSelect: () => void;
  onEdit: (title: string) => void;
  onDelete: () => void;
};

export function ChatListItem({
  chat,
  isActive,
  onSelect,
  onEdit,
  onDelete,
}: ChatListItemProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        onClick={onSelect}
        tooltip={chat.title}
      >
        <MessageSquare />
        <span className="truncate">{chat.title}</span>
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction showOnHover>
            <MoreHorizontal />
            <span className="sr-only">More options</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="right">
          <DropdownMenuItem onSelect={() => setShowEditDialog(true)}>
            <Pencil />
            <span>Rename</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onDelete} variant="destructive">
            <Trash2 />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditChatTitleForm
        currentTitle={chat.title}
        onOpenChange={setShowEditDialog}
        onSave={onEdit}
        open={showEditDialog}
      />
    </SidebarMenuItem>
  );
}
