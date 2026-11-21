"use client";

import * as React from "react";

import {
  CreateSession,
  DeleteSession,
  GetMessages,
  ListSessions,
  RunSession,
  socket,
} from "@/socket";

export type TextPart = { kind: "text"; id: string; text: string };
export type ToolPart = {
  kind: "tool";
  id: string;
  name: string;
  args: string;
  status: "running" | "done";
};
export type AssistantPart = TextPart | ToolPart;

export type ChatMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; parts: AssistantPart[]; error?: string };

export type SessionSummary = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
};

export type ChatStatus = "idle" | "creating" | "streaming";

type ChatContextValue = {
  sessions: SessionSummary[];
  activeId: string | null;
  messages: ChatMessage[];
  status: ChatStatus;
  loading: boolean;
  connected: boolean;
  notice: string | null;
  send: (query: string) => void;
  select: (id: string | null) => void;
  remove: (id: string) => void;
  dismissNotice: () => void;
};

// Messages typed before the server has created the session live under this key.
const DRAFT = "draft";
const EMPTY: ChatMessage[] = [];

// The subset of the OpenAI Responses stream events the UI renders.
type StreamEvent = {
  type: string;
  item_id?: string;
  delta?: string;
  arguments?: string;
  message?: string;
  item?: { type: string; id?: string; name?: string; arguments?: string };
  response?: { error?: { message?: string } | null };
};

// A row of the `messages` table as sent by `session:messages`.
type MessageRow = {
  id: string;
  role: "user" | "assistant" | "system" | "developer" | null;
  type: "message" | "function_call" | "function_call_output";
  content: string | null;
  name: string | null;
  call_id: string | null;
  arguments: unknown;
  createdAt: string;
};

const ChatContext = React.createContext<ChatContextValue | null>(null);

export function useChat() {
  const ctx = React.useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside <ChatProvider>");
  return ctx;
}

function applyEvent(parts: AssistantPart[], ev: StreamEvent): AssistantPart[] {
  switch (ev.type) {
    case "response.output_item.added":
    case "response.output_item.done": {
      const item = ev.item;
      if (item?.type !== "function_call" || !item.id) return parts;
      const id = item.id;
      const exists = parts.some((p) => p.kind === "tool" && p.id === id);
      if (!exists) {
        return [
          ...parts,
          {
            kind: "tool",
            id,
            name: item.name ?? "tool",
            args: item.arguments ?? "",
            status: "running",
          },
        ];
      }
      if (ev.type === "response.output_item.done") {
        return parts.map((p) =>
          p.kind === "tool" && p.id === id
            ? { ...p, name: item.name ?? p.name, args: item.arguments ?? p.args }
            : p,
        );
      }
      return parts;
    }

    case "response.output_text.delta": {
      const id = ev.item_id ?? "text";
      const delta = ev.delta ?? "";
      const exists = parts.some((p) => p.kind === "text" && p.id === id);
      if (!exists) return [...parts, { kind: "text", id, text: delta }];
      return parts.map((p) =>
        p.kind === "text" && p.id === id ? { ...p, text: p.text + delta } : p,
      );
    }

    case "response.function_call_arguments.delta":
      return parts.map((p) =>
        p.kind === "tool" && p.id === ev.item_id
          ? { ...p, args: p.args + (ev.delta ?? "") }
          : p,
      );

    case "response.function_call_arguments.done":
      return parts.map((p) =>
        p.kind === "tool" && p.id === ev.item_id
          ? { ...p, args: ev.arguments ?? p.args }
          : p,
      );

    default:
      return parts;
  }
}

function argsToString(value: unknown): string {
  if (typeof value === "string") return value === "null" ? "" : value;
  if (value == null) return "";
  return JSON.stringify(value);
}

// Rebuilds the live-stream shape from stored rows: every user message opens a
// turn, and all assistant text and tool calls until the next one fold into a
// single assistant message.
function rowsToMessages(rows: MessageRow[]): ChatMessage[] {
  // The server's ordering isn't guaranteed, so sort here. Ties keep the
  // reverse of arrival order, matching a newest-first response.
  const ordered = rows
    .map((row, index) => ({ row, index }))
    .sort(
      (a, b) =>
        +new Date(a.row.createdAt) - +new Date(b.row.createdAt) ||
        b.index - a.index,
    )
    .map(({ row }) => row);

  const out: ChatMessage[] = [];
  let assistant: Extract<ChatMessage, { role: "assistant" }> | null = null;

  const current = () => {
    if (!assistant) {
      assistant = { id: `a-${out.length}`, role: "assistant", parts: [] };
      out.push(assistant);
    }
    return assistant;
  };

  for (const row of ordered) {
    if (row.type === "function_call") {
      current().parts.push({
        kind: "tool",
        id: row.call_id ?? row.id,
        name: row.name ?? "tool",
        args: argsToString(row.arguments),
        status: "done",
      });
    } else if (row.type === "message" && row.content) {
      if (row.role === "user") {
        assistant = null;
        out.push({ id: row.id, role: "user", text: row.content });
      } else if (row.role === "assistant") {
        current().parts.push({ kind: "text", id: row.id, text: row.content });
      }
    }
  }

  return out;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = React.useState<SessionSummary[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [threads, setThreads] = React.useState<Record<string, ChatMessage[]>>(
    {},
  );
  const [status, setStatusState] = React.useState<ChatStatus>("idle");
  const [connected, setConnected] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  // Sessions whose history was fetched, or whose thread is built live.
  const loadedRef = React.useRef(new Set<string>());
  const loadingRef = React.useRef<string | null>(null);

  // Stream events carry no session id, so remember which thread is running.
  const statusRef = React.useRef<ChatStatus>("idle");
  const runningRef = React.useRef<string>(DRAFT);
  const pendingQueryRef = React.useRef<string>("");
  const idRef = React.useRef(0);

  const nextId = () => `m${++idRef.current}`;

  const setStatus = React.useCallback((next: ChatStatus) => {
    statusRef.current = next;
    setStatusState(next);
  }, []);

  const patchAssistant = React.useCallback(
    (
      key: string,
      fn: (m: Extract<ChatMessage, { role: "assistant" }>) => ChatMessage,
    ) => {
      setThreads((prev) => {
        const list = prev[key];
        if (!list) return prev;
        const i = list.findLastIndex((m) => m.role === "assistant");
        if (i === -1) return prev;
        const target = list[i] as Extract<ChatMessage, { role: "assistant" }>;
        const next = list.slice();
        next[i] = fn(target);
        return { ...prev, [key]: next };
      });
    },
    [],
  );

  React.useEffect(() => {
    const finish = (key: string) => {
      patchAssistant(key, (m) => ({
        ...m,
        parts: m.parts.map((p) =>
          p.kind === "tool" ? { ...p, status: "done" as const } : p,
        ),
      }));
      setStatus("idle");
    };

    // Drop an in-flight history fetch so selecting the session retries it.
    const abandonLoad = () => {
      if (!loadingRef.current) return;
      loadedRef.current.delete(loadingRef.current);
      loadingRef.current = null;
      setLoadingId(null);
    };

    const fail = (message: string) => {
      if (loadingRef.current) abandonLoad();
      if (statusRef.current === "idle") {
        setNotice(message);
        return;
      }
      patchAssistant(runningRef.current, (m) => ({ ...m, error: message }));
      finish(runningRef.current);
    };

    const onConnect = () => {
      setConnected(true);
      ListSessions();
    };

    const onDisconnect = () => {
      setConnected(false);
      abandonLoad();
      if (statusRef.current !== "idle") fail("Connection to the server was lost.");
    };

    const onLists = (payload: { data: SessionSummary[] }) => {
      const rows = [...(payload.data ?? [])].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      );
      setSessions(rows);
    };

    const onCreated = (payload: {
      sessionId: string;
      title: string;
      description: string;
    }) => {
      const { sessionId } = payload;
      loadedRef.current.add(sessionId);
      setSessions((prev) => [
        {
          id: sessionId,
          title: payload.title,
          description: payload.description,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setThreads((prev) => {
        const { [DRAFT]: draft, ...rest } = prev;
        return { ...rest, [sessionId]: draft ?? [] };
      });
      setActiveId(sessionId);
      runningRef.current = sessionId;
      setStatus("streaming");
      RunSession(sessionId, pendingQueryRef.current);
    };

    const onMessages = (payload: { sessionId: string; messages: MessageRow[] }) => {
      const { sessionId } = payload;
      if (loadingRef.current === sessionId) {
        loadingRef.current = null;
        setLoadingId(null);
      }
      // A live stream already owns this thread; don't overwrite it.
      if (statusRef.current !== "idle" && runningRef.current === sessionId) return;

      const rows = payload.messages ?? [];
      setThreads((prev) => ({ ...prev, [sessionId]: rowsToMessages(rows) }));
    };

    const onEvent = (ev: StreamEvent) => {
      if (ev.type === "error") {
        fail(ev.message ?? "The model returned an error.");
        return;
      }
      if (ev.type === "response.failed") {
        fail(ev.response?.error?.message ?? "The response failed.");
        return;
      }
      patchAssistant(runningRef.current, (m) => ({
        ...m,
        parts: applyEvent(m.parts, ev),
      }));
    };

    const onFinished = () => finish(runningRef.current);

    const onDeleted = (payload: { sessionId: string }) => {
      loadedRef.current.delete(payload.sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== payload.sessionId));
      setThreads((prev) => {
        const rest = { ...prev };
        delete rest[payload.sessionId];
        return rest;
      });
      setActiveId((cur) => (cur === payload.sessionId ? null : cur));
    };

    const onException = (err: { message?: string } | string) => {
      fail(
        typeof err === "string"
          ? err
          : (err?.message ?? "Something went wrong on the server."),
      );
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("session:lists", onLists);
    socket.on("session:created", onCreated);
    socket.on("session:messages", onMessages);
    socket.on("session:event", onEvent);
    socket.on("session:finished", onFinished);
    socket.on("session:deleted", onDeleted);
    socket.on("exception", onException);

    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("session:lists", onLists);
      socket.off("session:created", onCreated);
      socket.off("session:messages", onMessages);
      socket.off("session:event", onEvent);
      socket.off("session:finished", onFinished);
      socket.off("session:deleted", onDeleted);
      socket.off("exception", onException);
    };
  }, [patchAssistant, setStatus]);

  const send = React.useCallback(
    (query: string) => {
      const text = query.trim();
      if (!text || statusRef.current !== "idle") return;

      const key = activeId ?? DRAFT;
      setNotice(null);
      setThreads((prev) => ({
        ...prev,
        [key]: [
          ...(prev[key] ?? []),
          { id: nextId(), role: "user", text },
          { id: nextId(), role: "assistant", parts: [] },
        ],
      }));

      runningRef.current = key;
      if (activeId) {
        setStatus("streaming");
        RunSession(activeId, text);
      } else {
        pendingQueryRef.current = text;
        setStatus("creating");
        CreateSession(text);
      }
    },
    [activeId, setStatus],
  );

  const select = React.useCallback((id: string | null) => {
    setActiveId(id);
    if (id && !loadedRef.current.has(id) && socket.connected) {
      loadedRef.current.add(id);
      loadingRef.current = id;
      setLoadingId(id);
      GetMessages(id);
    }
    // Leaving a finished draft behind keeps "New chat" from showing old text.
    if (id === null && statusRef.current === "idle") {
      setThreads((prev) => {
        const rest = { ...prev };
        delete rest[DRAFT];
        return rest;
      });
    }
  }, []);

  const remove = React.useCallback((id: string) => DeleteSession(id), []);
  const dismissNotice = React.useCallback(() => setNotice(null), []);

  const messages = threads[activeId ?? DRAFT] ?? EMPTY;
  const loading = activeId !== null && loadingId === activeId;

  const value = React.useMemo<ChatContextValue>(
    () => ({
      sessions,
      activeId,
      messages,
      status,
      loading,
      connected,
      notice,
      send,
      select,
      remove,
      dismissNotice,
    }),
    [
      sessions,
      activeId,
      messages,
      status,
      loading,
      connected,
      notice,
      send,
      select,
      remove,
      dismissNotice,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
