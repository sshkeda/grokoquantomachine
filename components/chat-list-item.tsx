import { useMutationState } from "@tanstack/react-query";
import {
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
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
import {
  type GenerateTitleVariables,
  generateTitleMutationKey,
} from "@/lib/mutations";
import { cn } from "@/lib/utils";

function isGenerateTitleVariables(
  variables: unknown
): variables is GenerateTitleVariables {
  return (
    typeof variables === "object" &&
    variables !== null &&
    "id" in variables &&
    typeof variables.id === "string"
  );
}

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

  const pendingMutationIds = useMutationState({
    filters: {
      mutationKey: generateTitleMutationKey,
      status: "pending",
    },
    select: (mutation) => {
      const variables = mutation.state.variables;
      return isGenerateTitleVariables(variables) ? variables.id : null;
    },
  });

  const isPending = pendingMutationIds.includes(chat.id);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        onClick={onSelect}
        tooltip={isPending ? "Generating title..." : chat.title}
      >
        {isPending ? <Loader2 className="animate-spin" /> : <MessageSquare />}
        <span
          className={cn(
            "truncate",
            isPending ? "animate-pulse text-muted-foreground italic" : ""
          )}
        >
          {chat.title}
        </span>
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
