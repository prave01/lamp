"use client";

import { Bot, Plus } from "lucide-react";

import {
  useChat,
  type SessionSummary,
} from "@/components/chat/chat-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DAY = 24 * 60 * 60 * 1000;

function groupSessions(sessions: SessionSummary[]) {
  // Sessions only arrive after connecting, so nothing reads the clock during
  // prerender (cacheComponents forbids that).
  if (sessions.length === 0) return [];

  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const buckets: { label: string; sessions: SessionSummary[] }[] = [
    { label: "Today", sessions: [] },
    { label: "Yesterday", sessions: [] },
    { label: "Previous 7 days", sessions: [] },
    { label: "Older", sessions: [] },
  ];

  for (const session of sessions) {
    const age = startOfToday - new Date(session.createdAt).getTime();
    const bucket = age <= 0 ? 0 : age <= DAY ? 1 : age <= 7 * DAY ? 2 : 3;
    buckets[bucket]!.sessions.push(session);
  }

  return buckets.filter((b) => b.sessions.length > 0);
}

/*
 * The sessions rail. Rendered once in the desktop aside and once inside the
 * mobile sheet, so it must not rely on its container for layout.
 */
export function ChatSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { sessions, activeId, connected, select } = useChat();
  const groups = groupSessions(sessions);

  return (
    <div className="flex h-full min-h-0 flex-col text-sidebar-foreground">
      <div className="flex h-14 shrink-0 items-center gap-2 px-4">
        <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Bot className="size-3.5" />
        </div>
        <span className="font-semibold tracking-tight">Agent Builder</span>
      </div>

      <div className="px-3 pb-3">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => {
            select(null);
            onNavigate?.();
          }}
        >
          <Plus />
          New chat
        </Button>
      </div>

      <nav
        aria-label="Sessions"
        className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 pb-3"
      >
        {groups.length === 0 ? (
          <p className="px-2 text-sm text-muted-foreground">
            {connected
              ? "No sessions yet. Send a message to start one."
              : "Connecting to the server…"}
          </p>
        ) : null}

        {groups.map((group) => (
          <div key={group.label}>
            <h2 className="px-2 pb-1 text-xs font-medium text-muted-foreground">
              {group.label}
            </h2>
            <ul className="space-y-0.5">
              {group.sessions.map((session) => {
                const active = session.id === activeId;
                return (
                  <li key={session.id}>
                    <button
                      type="button"
                      aria-current={active ? "page" : undefined}
                      title={session.title}
                      onClick={() => {
                        select(session.id);
                        onNavigate?.();
                      }}
                      className={cn(
                        "flex h-8 w-full items-center rounded-md px-2 text-left text-sm outline-none",
                        "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        "focus-visible:ring-[3px] focus-visible:ring-sidebar-ring/50",
                        "aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-medium aria-[current=page]:text-sidebar-accent-foreground",
                      )}
                    >
                      <span className="truncate">{session.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex shrink-0 items-center gap-2 border-t border-sidebar-border p-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
          P
        </div>
        <span className="min-w-0 flex-1 truncate text-sm">prave01</span>
        <ThemeToggle />
      </div>
    </div>
  );
}
