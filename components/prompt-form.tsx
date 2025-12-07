import { ArrowUp, Plus } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "./ui/button";

export default function PromptForm() {
  return (
    <form className="px-2 pb-2">
      <div className="flex flex-col rounded-lg border">
        <TextareaAutosize
          className="h-10 w-full resize-none p-2 outline-none"
          maxRows={6}
          minRows={1}
          spellCheck={false}
        />
        <div className="flex justify-between px-1 pb-1">
          <Button size="icon" variant="outline">
            <Plus />
          </Button>
          <Button size="icon" variant="default">
            <ArrowUp />
          </Button>
        </div>
      </div>
    </form>
  );
}
