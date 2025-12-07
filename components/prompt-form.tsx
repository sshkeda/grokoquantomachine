"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUp, Loader2, Plus, Square } from "lucide-react";
import type { KeyboardEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import TextareaAutosize from "react-textarea-autosize";
import { z } from "zod";
import type { BaseUIMessage } from "@/lib/types";
import { Button } from "./ui/button";

const formSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

function PromptFormSubmitButton(props: {
  status: UseChatHelpers<BaseUIMessage>["status"];
  stop: UseChatHelpers<BaseUIMessage>["stop"];
  isValid: boolean;
}) {
  if (props.status === "streaming") {
    return (
      <Button onClick={props.stop} size="icon" type="button" variant="default">
        <Square />
      </Button>
    );
  }
  if (props.status === "submitted") {
    return (
      <Button disabled size="icon" type="button" variant="default">
        <Loader2 className="animate-spin" />
      </Button>
    );
  }
  return (
    <Button
      disabled={!props.isValid}
      size="icon"
      type="submit"
      variant="default"
    >
      <ArrowUp />
    </Button>
  );
}

export default function PromptForm(props: {
  onSubmit: (message: string) => void;
  status: UseChatHelpers<BaseUIMessage>["status"];
  stop: UseChatHelpers<BaseUIMessage>["stop"];
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    props.onSubmit(data.message);
    form.reset();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.handleSubmit(handleSubmit)();
    }
  };

  return (
    <form className="px-2 pt-1 pb-2" onSubmit={form.handleSubmit(handleSubmit)}>
      <div className="flex flex-col rounded-lg border">
        <Controller
          control={form.control}
          name="message"
          render={({ field }) => (
            <TextareaAutosize
              {...field}
              className="h-10 w-full resize-none p-2 outline-none"
              maxRows={6}
              minRows={1}
              onKeyDown={handleKeyDown}
              placeholder="Send a message..."
              spellCheck={false}
            />
          )}
        />
        <div className="flex justify-between px-1 pb-1">
          <Button size="icon" type="button" variant="outline">
            <Plus />
          </Button>
          <PromptFormSubmitButton
            isValid={form.formState.isValid}
            status={props.status}
            stop={props.stop}
          />
        </div>
      </div>
    </form>
  );
}
