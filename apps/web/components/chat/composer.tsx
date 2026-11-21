"use client";

import * as React from "react";
import { ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/*
 * The field and the send key share one bordered container so the focus ring
 * wraps both. The textarea grows with its content (field-sizing) up to 12rem.
 * Enter sends, Shift+Enter adds a line.
 */
export function Composer({
  onSend,
  disabled = false,
  placeholder = "Message the agent",
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = React.useState("");
  const canSend = !disabled && value.trim().length > 0;

  function submit() {
    if (!canSend) return;
    onSend(value);
    setValue("");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-end gap-2 rounded-xl border bg-card p-2 shadow-xs transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
    >
      <Textarea
        name="message"
        aria-label="Message"
        placeholder={placeholder}
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        className="max-h-48 min-h-9 flex-1 resize-none border-0 bg-transparent px-2 py-1.5 shadow-none focus-visible:ring-0 dark:bg-transparent"
      />
      <Button
        type="submit"
        size="icon"
        className="size-9 shrink-0"
        aria-label="Send message"
        disabled={!canSend}
      >
        <ArrowUp />
      </Button>
    </form>
  );
}
