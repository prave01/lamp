"use client";

import * as React from "react";
import { TriangleAlert, X } from "lucide-react";

import { useChat, type ChatMessage } from "@/components/chat/chat-provider";
import { Composer } from "@/components/chat/composer";
import { Message, ToolCall } from "@/components/chat/message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// The gateway runs every session on this model.
const MODEL = "openai/gpt-4o-mini";

// Stored tool args/output can be JSON, or JSON wrapped in a JSON string.
function prettyJson(raw: string) {
  try {
    let value: unknown = JSON.parse(raw);
    for (let i = 0; i < 2 && typeof value === "string"; i++) {
      try {
        value = JSON.parse(value);
      } catch {
        break;
      }
    }
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  } catch {
    return raw;
  }
}

function assistantText(message: Extract<ChatMessage, { role: "assistant" }>) {
  return message.parts
    .flatMap((p) => (p.kind === "text" ? [p.text] : []))
    .join("\n\n");
}

export default function ChatPage() {
  const {
    sessions,
    activeId,
    messages,
    status,
    loading,
    connected,
    notice,
    send,
    dismissNotice,
  } = useChat();

  const active = sessions.find((s) => s.id === activeId);
  const busy = status !== "idle";

  // Follow the stream unless the reader has scrolled up.
  const scroller = React.useRef<HTMLDivElement>(null);
  const stick = React.useRef(true);

  React.useEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  React.useEffect(() => {
    stick.current = true;
  }, [activeId]);

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b pr-4 pl-14 md:px-6">
        <h1 className="truncate text-sm font-semibold tracking-tight">
          {active?.title ?? "New chat"}
        </h1>
        <Badge variant="outline" className="shrink-0 font-mono">
          {MODEL}
        </Badge>
      </header>

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 md:px-6">
          {messages.length === 0 ? (
            <div className="py-16 text-center">
              <h2 className="text-lg font-semibold tracking-tight">
                {active ? active.title : "What should the agent work on?"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {loading
                  ? "Loading messages…"
                  : active
                    ? "No messages yet. Anything you send continues this session."
                    : "Your first message starts a new session."}
              </p>
            </div>
          ) : null}

          {messages.map((message) =>
            message.role === "user" ? (
              <Message key={message.id} role="user">
                <span className="whitespace-pre-wrap">{message.text}</span>
              </Message>
            ) : (
              <Message
                key={message.id}
                role="assistant"
                copyText={assistantText(message) || undefined}
              >
                {message.parts.length === 0 && !message.error ? (
                  <p className="text-muted-foreground">
                    {status === "creating" ? "Starting session…" : "Thinking…"}
                  </p>
                ) : null}

                {message.parts.map((part) =>
                  part.kind === "text" ? (
                    <p key={part.id} className="whitespace-pre-wrap">
                      {part.text}
                    </p>
                  ) : (
                    <ToolCall
                      key={part.id}
                      name={part.name}
                      args={prettyJson(part.args)}
                      output={
                        part.output !== undefined
                          ? prettyJson(part.output)
                          : undefined
                      }
                      status={part.status}
                    />
                  ),
                )}

                {message.error ? (
                  <p className="flex items-start gap-2 text-signal-error">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                    <span>{message.error}</span>
                  </p>
                ) : null}
              </Message>
            ),
          )}
        </div>
      </div>

      <div className="shrink-0 px-4 pt-2 pb-4 md:px-6">
        <div className="mx-auto w-full max-w-3xl space-y-2">
          {notice ? (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border bg-signal-error-soft px-3 py-2 text-sm"
            >
              <TriangleAlert className="size-4 shrink-0 text-signal-error" />
              <span className="min-w-0 flex-1">{notice}</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                aria-label="Dismiss"
                onClick={dismissNotice}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ) : null}

          <Composer
            onSend={send}
            disabled={busy || loading || !connected}
            placeholder={
              connected ? "Message the agent" : "Connecting to the server…"
            }
          />
        </div>
      </div>
    </main>
  );
}
