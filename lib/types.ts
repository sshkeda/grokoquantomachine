import type { InferUITools, UIMessage, UIMessagePart } from "ai";
import type { BaseTools } from "@/app/api/chat/agent";

export type BaseUIMetadata = never;
export type BaseUIDataTypes = {
  sandbox: { sandboxId: string };
};
export type BaseUITools = InferUITools<BaseTools>;

export type BaseUIMessage = UIMessage<
  BaseUIMetadata,
  BaseUIDataTypes,
  BaseUITools
>;
export type BaseUIMessagePart = UIMessagePart<BaseUIDataTypes, BaseUITools>;
