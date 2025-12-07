import { ArrowUp, Plus } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "./ui/button";

export default function PromptForm() {
  return (
    <form className="px-2 pb-2">
      <div className="flex flex-col border rounded-lg">
        <TextareaAutosize
          className="w-full resize-none h-10 outline-none p-2"
          minRows={1}
          spellCheck={false}
          maxRows={6}
        />
        <div className="flex justify-between px-1 pb-1">
          <Button variant="outline" size="icon">
            <Plus />
          </Button>
          <Button variant="default" size="icon">
            <ArrowUp />
          </Button>
        </div>
      </div>
    </form>
  );
}
