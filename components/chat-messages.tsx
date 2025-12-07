import type { UseChatHelpers } from "@ai-sdk/react";
import { Streamdown } from "streamdown";
import { useStickToBottom } from "use-stick-to-bottom";
import type { BaseUIMessage, BaseUIMessagePart } from "@/lib/types";

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

  return null;
}
