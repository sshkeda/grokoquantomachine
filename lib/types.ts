import type { UIMessage, UIMessagePart } from "ai";

export type BaseUIMetadata = never;
export type BaseUIDataTypes = never;
export type BaseUITools = never;

export type BaseUIMessage = UIMessage<
  BaseUIDataTypes,
  BaseUIMetadata,
  BaseUITools
>;
export type BaseUIMessagePart = UIMessagePart<BaseUIDataTypes, BaseUITools>;
