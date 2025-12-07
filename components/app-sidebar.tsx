"use client";

import { Plus, Sparkle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatList } from "@/components/chat-list";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="justify-start group-data-[collapsible=icon]:justify-center"
              onClick={toggleSidebar}
              size="lg"
              tooltip="Toggle Sidebar"
            >
              <Sparkle className="group-hover/menu-item:-rotate-6 h-4 w-4 animate-[pulse_2.2s_ease-in-out_infinite] transition-transform duration-500 group-active/menu-item:scale-90 motion-reduce:transform-none motion-reduce:transition-none" />
              <span className="group-data-[collapsible=icon]:hidden">
                GrokoQuantoMachine
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="justify-start group-data-[collapsible=icon]:justify-center"
              isActive={pathname === "/"}
              tooltip="New Chat"
            >
              <Link href="/">
                <Plus />
                <span className="group-data-[collapsible=icon]:hidden">
                  New Chat
                </span>
              </Link>
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
