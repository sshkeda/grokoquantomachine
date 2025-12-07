"use client";

import { Home, Plus } from "lucide-react";
import Link from "next/link";
import { ChatList } from "@/components/chat-list";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useChatId } from "@/hooks/use-chat-id";

export function AppSidebar() {
  const [currentChatId, setCurrentChatId] = useChatId();

  const handleNewChat = () => {
    setCurrentChatId(null);
  };

  const isNewChat = !currentChatId;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Home">
              <Link href="/">
                <Home />
                <span>Home</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isNewChat}
              onClick={handleNewChat}
              tooltip="New Chat"
            >
              <Plus />
              <span>New Chat</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <ChatList />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
