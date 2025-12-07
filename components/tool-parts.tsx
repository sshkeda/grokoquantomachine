import type { ToolUIPart } from "ai";
import { Check, Loader2, X } from "lucide-react";
import type { BaseUITools } from "@/lib/types";
import { CodeBlock } from "./code-block";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

type ExecuteCodePart = ToolUIPart<Pick<BaseUITools, "executeCode">>;

export function ExecuteCodeToolPart(props: { part: ExecuteCodePart }) {
  return (
    <Collapsible className="my-2 rounded-lg border p-2">
      <CollapsibleTrigger className="flex items-center gap-2">
        <ToolStatusIcon state={props.part.state} />
        <span>Execute Code</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-4 pt-4">
        {props.part.input !== undefined && (
          <CodeBlock
            code={props.part.input.code ?? ""}
            isAnimating={
              props.part.state === "input-available" ||
              props.part.state === "input-streaming"
            }
            language="python"
          />
        )}
        {props.part.state === "output-available" &&
          props.part.output.stdout.length > 0 && (
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">stdout</span>
              <CodeBlock code={props.part.output.stdout} controls={false} />
            </div>
          )}
        {props.part.state === "output-available" &&
          props.part.output.stderr.length > 0 && (
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">stderr</span>
              <CodeBlock code={props.part.output.stderr} controls={false} />
            </div>
          )}
        {props.part.state === "output-error" && (
          <div className="text-red-500 text-sm">{props.part.errorText}</div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function ToolStatusIcon(props: { state: ExecuteCodePart["state"] }) {
  if (props.state === "input-available") {
    return <Loader2 className="size-4 animate-spin text-muted-foreground" />;
  }
  if (props.state === "input-streaming") {
    return <Loader2 className="size-4 animate-spin text-muted-foreground" />;
  }
  if (props.state === "output-available") {
    return <Check className="size-4 text-green-500" />;
  }
  return <X className="size-4 text-red-500" />;
}
