"use client";

import * as React from "react";
import { Bot, Check, Copy, ShieldQuestion, Wrench, X } from "lucide-react";

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

/*
 * A tool call the server is holding until a person decides. Sits above the
 * composer, which stays disabled while the run is paused.
 */
export function ApprovalRequest({
  name,
  description,
  args,
  onRespond,
}: {
  name: string;
  description: string;
  args: string;
  onRespond: (approved: boolean) => void;
}) {
  return (
    <div
      role="alertdialog"
      aria-label={`Approve ${name}?`}
      className="overflow-hidden rounded-lg border bg-card"
    >
      <div className="flex items-center gap-2 border-b bg-signal-tool-soft px-3 py-2">
        <ShieldQuestion className="size-4 shrink-0 text-signal-tool" />
        <span className="text-sm font-medium">Approval needed</span>
        <Badge variant="tool" className="ml-auto font-mono">
          <Wrench />
          {name}
        </Badge>
      </div>
      <div className="space-y-2 px-3 py-2 text-sm">
        {description ? (
          <p className="text-muted-foreground">{description}</p>
        ) : null}
        <pre className="overflow-x-auto rounded-md border bg-background px-3 py-2">
          {args}
        </pre>
      </div>
      <div className="flex justify-end gap-2 border-t px-3 py-2">
        <Button variant="outline" size="sm" onClick={() => onRespond(false)}>
          <X />
          Reject
        </Button>
        <Button size="sm" onClick={() => onRespond(true)}>
          <Check />
          Approve
        </Button>
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
