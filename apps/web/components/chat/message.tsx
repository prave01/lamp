"use client";

import * as React from "react";
import { Bot, Copy, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/*
 * Two voices. People get an inverse-ink bubble aligned right. The agent gets
 * a bordered panel with an avatar, aligned left. Anything a machine produced
 * (tool args, stdout) goes in <ToolCall>, set in mono.
 */
export function Message({
  role,
  children,
  className,
  copyText,
}: {
  role: "user" | "assistant";
  children: React.ReactNode;
  className?: string;
  /** When set, the assistant message shows a Copy button for this text. */
  copyText?: string;
}) {
  if (role === "user") {
    return (
      <div data-role="user" className={cn("flex justify-end", className)}>
        <div className="max-w-[85%] rounded-xl rounded-br-sm bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground sm:max-w-[75%]">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div data-role="assistant" className={cn("group flex gap-3", className)}>
      <div
        aria-hidden
        className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border bg-card"
      >
        <Bot className="size-4" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
        <div className="max-w-full space-y-3 rounded-xl rounded-tl-sm border bg-card px-4 py-3 text-sm leading-relaxed text-card-foreground">
          {children}
        </div>
        {copyText ? (
          <div className="flex items-center gap-0.5 text-muted-foreground transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Copy message"
              onClick={() => void navigator.clipboard.writeText(copyText)}
            >
              <Copy className="size-3.5" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ToolCall({
  name,
  args,
  output,
  status = "done",
}: {
  name: string;
  args: string;
  output?: string;
  status?: "running" | "done" | "error";
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <Badge variant="tool" className="font-mono">
          <Wrench />
          {name}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {status === "error"
            ? "Failed"
            : status === "running"
              ? "Running"
              : "Finished"}
        </span>
      </div>
      <pre className="overflow-x-auto px-3 py-2 text-foreground">{args}</pre>
      {output ? (
        <pre
          className={cn(
            "overflow-x-auto border-t px-3 py-2 text-foreground",
            status === "error" ? "bg-signal-error-soft" : "bg-signal-sandbox-soft",
          )}
        >
          {output}
        </pre>
      ) : null}
    </div>
  );
}
