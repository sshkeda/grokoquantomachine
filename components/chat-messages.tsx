import type { BaseUIMessage, BaseUIMessagePart } from "@/lib/types";

export default function ChatMessages(props: { messages: BaseUIMessage[] }) {
  return (
    <div className="flex flex-1 flex-col gap-2 p-2">
      {props.messages.map((message) => (
        <div key={message.id}>
          {message.parts.map((part, index) => (
            <MessagePart key={`${message.id}-${index}`} part={part} />
          ))}
        </div>
      ))}
    </div>
  );
}

function MessagePart(props: { part: BaseUIMessagePart }) {
  if (props.part.type === "text") {
    return <div>{props.part.text}</div>;
  }

  return null;
}
