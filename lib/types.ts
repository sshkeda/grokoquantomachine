import type { InferUITools, UIMessage, UIMessagePart } from "ai";
import type { BaseTools } from "@/app/api/chat/agent";

export type BaseUIMetadata = never;
export type BaseUIDataTypes = never;
export type BaseUITools = InferUITools<BaseTools>;

export type BaseUIMessage = UIMessage<
  BaseUIDataTypes,
  BaseUIMetadata,
  BaseUITools
>;
export type BaseUIMessagePart = UIMessagePart<BaseUIDataTypes, BaseUITools>;
