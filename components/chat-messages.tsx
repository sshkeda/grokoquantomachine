import type { UseChatHelpers } from "@ai-sdk/react";
import { Streamdown } from "streamdown";
import { useStickToBottom } from "use-stick-to-bottom";
import type { BaseUIMessage, BaseUIMessagePart } from "@/lib/types";
import { ExecuteCodeToolPart } from "./tool-parts";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

export default function ChatMessages(props: {
  messages: BaseUIMessage[];
  status: UseChatHelpers<BaseUIMessage>["status"];
}) {
  const { scrollRef, contentRef } = useStickToBottom();

  return (
    <div className="flex-1 overflow-y-auto p-2" ref={scrollRef}>
      <div className="flex flex-col gap-2" ref={contentRef}>
        {props.messages.map((message) => (
          <div key={message.id}>
            {message.parts.map((part, index) => (
              <MessagePart
                key={`${message.id}-${index}`}
                message={message}
                part={part}
                status={props.status}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function MessagePart(props: {
  message: BaseUIMessage;
  part: BaseUIMessagePart;
  status: UseChatHelpers<BaseUIMessage>["status"];
}) {
  if (props.message.role === "user") {
    if (props.part.type === "text") {
      return (
        <div className="whitespace-pre-wrap rounded-sm border p-2">
          {props.part.text}
        </div>
      );
    }

    return null;
  }
  if (props.part.type === "text") {
    return (
      <Streamdown isAnimating={props.status === "streaming"}>
        {props.part.text}
      </Streamdown>
    );
  }

  if (props.part.type === "reasoning") {
    return (
      <Collapsible>
        <CollapsibleTrigger>Reasoning</CollapsibleTrigger>
        <CollapsibleContent>{props.part.text}</CollapsibleContent>
      </Collapsible>
    );
  }

  if (props.part.type === "file") {
    return null;
  }

  if (props.part.type === "dynamic-tool") {
    return null;
  }

  if (props.part.type === "source-url") {
    return null;
  }

  if (props.part.type === "step-start") {
    return null;
  }

  if (props.part.type === "source-document") {
    return null;
  }

  if (props.part.type === "tool-executeCode") {
    return <ExecuteCodeToolPart part={props.part} />;
  }

  return null;
}
