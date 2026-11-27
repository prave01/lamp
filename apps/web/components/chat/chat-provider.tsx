"use client";

import * as React from "react";
import type { ServerToClientEvents } from "@repo/shared";

import {
  CreateSession,
  ChangeFocus,
  GetMessages,
  ListSessions,
  RespondApproval,
  RunSession,
  getSocket,
} from "@/socket";

export type TextPart = { kind: "text"; id: string; text: string };
export type ToolPart = {
  kind: "tool";
  id: string;
  name: string;
  args: string;
  /** Matches `server:tool:ran`; `id` is the output item id instead. */
  callId?: string;
  /** Live exec output streamed by `server:tool:exec:log`, until `output` lands. */
  logs?: string;
  output?: string;
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

// A tool call the server is holding until the user approves or rejects it.
export type PendingApproval = {
  approvalId: string;
  sessionId: string;
  name: string;
  description: string;
  args: unknown;
};

type ChatContextValue = {
  sessions: SessionSummary[];
  activeId: string | null;
  messages: ChatMessage[];
  status: ChatStatus;
  loading: boolean;
  connected: boolean;
  notice: string | null;
  /** The approval request for the session being viewed, if any. */
  approval: PendingApproval | null;
  respond: (approved: boolean) => void;
  send: (query: string) => void;
  select: (id: string | null) => void;
  dismissNotice: () => void;
};

// Messages typed before the server has created the session live under this key.
const DRAFT = "draft";
const EMPTY: ChatMessage[] = [];

const ChatContext = React.createContext<ChatContextValue | null>(null);

export function useChat() {
  const ctx = React.useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside <ChatProvider>");
  return ctx;
}

type MessageRow = Parameters<
  ServerToClientEvents["server:session:messages"]
>[0]["messages"][number];

// The raw OpenAI Responses stream event, as forwarded by the server.
type StreamEvent = Parameters<
  ServerToClientEvents["server:session:run:event"]
>[0]["event"];

// Folds one stream event into the assistant message's parts. Tool parts are
// keyed by the output item id, which is what the argument events refer to.
function applyEvent(parts: AssistantPart[], ev: StreamEvent): AssistantPart[] {
  switch (ev.type) {
    case "response.output_text.delta": {
      const exists = parts.some(
        (p) => p.kind === "text" && p.id === ev.item_id,
      );
      if (!exists)
        return [...parts, { kind: "text", id: ev.item_id, text: ev.delta }];
      return parts.map((p) =>
        p.kind === "text" && p.id === ev.item_id
          ? { ...p, text: p.text + ev.delta }
          : p,
      );
    }

    case "response.output_item.added":
    case "response.output_item.done": {
      const { item } = ev;
      if (item.type !== "function_call") return parts;
      const id = item.id ?? item.call_id;
      const exists = parts.some((p) => p.kind === "tool" && p.id === id);
      if (!exists) {
        return [
          ...parts,
          {
            kind: "tool",
            id,
            name: item.name,
            args: item.arguments,
            callId: item.call_id,
            status: "running",
          },
        ];
      }
      if (ev.type === "response.output_item.done") {
        return parts.map((p) =>
          p.kind === "tool" && p.id === id
            ? { ...p, name: item.name, args: item.arguments }
            : p,
        );
      }
      return parts;
    }

    case "response.function_call_arguments.delta":
      return parts.map((p) =>
        p.kind === "tool" && p.id === ev.item_id
          ? { ...p, args: p.args + ev.delta }
          : p,
      );

    case "response.function_call_arguments.done":
      return parts.map((p) =>
        p.kind === "tool" && p.id === ev.item_id
          ? { ...p, args: ev.arguments }
          : p,
      );

    default:
      return parts;
  }
}

// Rebuilds the live-stream shape from stored rows: every user message opens a
// turn, and all assistant text and tool calls until the next one fold into a
// single assistant message. System/developer rows are not shown.
function rowsToMessages(rows: MessageRow[]): ChatMessage[] {
  // `createdAt` is typed `Date` but arrives as an ISO string; ties keep the
  // server's order.
  const ordered = rows
    .map((row, index) => ({ row, index }))
    .sort(
      (a, b) =>
        +new Date(a.row.createdAt) - +new Date(b.row.createdAt) ||
        a.index - b.index,
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
        id: row.callId ?? row.id,
        name: row.name ?? "tool",
        args: row.arguments ?? "",
        status: "done",
      });
    } else if (row.type === "function_call_output") {
      const tool = current().parts.find(
        (p): p is ToolPart => p.kind === "tool" && p.id === row.callId,
      );
      if (tool) tool.output = row.content ?? "";
    } else if (row.content) {
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

function describeError(
  data: Parameters<ServerToClientEvents["server:session:error"]>[0],
) {
  const details = Object.values(data.errors ?? {}).flat();
  return details.length > 0
    ? `${data.message}: ${details.join(", ")}`
    : data.message;
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
  const [pendingApproval, setPendingApproval] =
    React.useState<PendingApproval | null>(null);

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
    // Drop an in-flight history fetch so selecting the session retries it.
    const abandonLoad = () => {
      if (!loadingRef.current) return;
      loadedRef.current.delete(loadingRef.current);
      loadingRef.current = null;
      setLoadingId(null);
    };

    const fail = (message: string) => {
      abandonLoad();
      setPendingApproval(null);
      if (statusRef.current === "idle") {
        setNotice(message);
        return;
      }
      patchAssistant(runningRef.current, (m) => ({ ...m, error: message }));
      setStatus("idle");
    };

    const onConnect = () => {
      setConnected(true);
      ListSessions();
    };

    // The schema types the timestamps as `Date`, but over the socket they
    // arrive as ISO strings; `new Date()` accepts both.
    const onList: ServerToClientEvents["server:session:list"] = ({
      sessions: rows,
    }) => {
      setSessions(
        rows
          .map((r) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            createdAt: new Date(r.createdAt).toISOString(),
          }))
          .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
      );
    };

    const onDisconnect = () => {
      setConnected(false);
      abandonLoad();
      if (statusRef.current !== "idle")
        fail("Connection to the server was lost.");
    };

    const onCreated: ServerToClientEvents["server:session:created"] = (
      payload,
    ) => {
      const { sessionId } = payload;
      loadedRef.current.add(sessionId);
      setSessions((prev) => [
        {
          id: sessionId,
          title: payload.title,
          description: payload.descrption,
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

    // The payload has no top-level session id, so use the id on the rows and
    // fall back to the session we asked for (an empty session has no rows).
    const onMessages: ServerToClientEvents["server:session:messages"] = ({
      messages: rows,
    }) => {
      const sessionId = rows[0]?.sessionId ?? loadingRef.current;
      if (!sessionId) return;

      if (loadingRef.current === sessionId) {
        loadingRef.current = null;
        setLoadingId(null);
      }
      // A live stream already owns this thread; don't overwrite it.
      if (statusRef.current !== "idle" && runningRef.current === sessionId)
        return;

      setThreads((prev) => ({ ...prev, [sessionId]: rowsToMessages(rows) }));
    };

    const onRunEvent: ServerToClientEvents["server:session:run:event"] = ({
      event,
    }) => {
      if (event.type === "error") {
        fail(event.message);
        return;
      }
      if (event.type === "response.failed") {
        fail(event.response.error?.message ?? "The response failed.");
        return;
      }
      patchAssistant(runningRef.current, (m) => ({
        ...m,
        parts: applyEvent(m.parts, event),
      }));
    };

    // The payload carries no session id; the approval belongs to the run.
    const onHitl: ServerToClientEvents["server:tool:hitl"] = ({
      approvalId,
      tool,
    }) => {
      setPendingApproval({
        approvalId,
        sessionId: runningRef.current,
        name: tool.name,
        description: tool.description,
        args: tool.args,
      });
    };

    const onToolRan: ServerToClientEvents["server:tool:ran"] = ({
      sessionId,
      callId,
    }) => {
      setThreads((prev) => {
        const list = prev[sessionId];
        if (!list) return prev;
        return {
          ...prev,
          [sessionId]: list.map((m) =>
            m.role === "assistant"
              ? {
                  ...m,
                  parts: m.parts.map((p) =>
                    p.kind === "tool" && p.callId === callId
                      ? { ...p, status: "done" as const }
                      : p,
                  ),
                }
              : m,
          ),
        };
      });
    };

    // Exec events carry only a call id, so patch the tool part in the run's thread.
    const patchTool = (callId: string, fn: (p: ToolPart) => ToolPart) =>
      patchAssistant(runningRef.current, (m) => ({
        ...m,
        parts: m.parts.map((p) =>
          p.kind === "tool" && p.callId === callId ? fn(p) : p,
        ),
      }));

    const onExecLog: ServerToClientEvents["server:tool:exec:log"] = ({
      callId,
      text,
    }) => {
      patchTool(callId, (p) => ({ ...p, logs: (p.logs ?? "") + text }));
    };

    const onExecDone: ServerToClientEvents["server:tool:exec:done"] = ({
      callId,
      output,
    }) => {
      patchTool(callId, (p) => ({ ...p, output }));
    };

    const onFinished: ServerToClientEvents["server:session:run:finished"] =
      () => {
        setPendingApproval(null);
        patchAssistant(runningRef.current, (m) => ({
          ...m,
          parts: m.parts.map((p) =>
            p.kind === "tool" ? { ...p, status: "done" as const } : p,
          ),
        }));
        setStatus("idle");
      };

    const onError: ServerToClientEvents["server:session:error"] = (data) => {
      fail(describeError(data));
    };

    const socket = getSocket();

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("server:session:list", onList);
    socket.on("server:session:created", onCreated);
    socket.on("server:session:messages", onMessages);
    socket.on("server:session:run:event", onRunEvent);
    socket.on("server:session:run:finished", onFinished);
    socket.on("server:session:error", onError);
    socket.on("server:tool:hitl", onHitl);
    socket.on("server:tool:ran", onToolRan);
    socket.on("server:tool:exec:log", onExecLog);
    socket.on("server:tool:exec:done", onExecDone);

    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("server:session:list", onList);
      socket.off("server:session:created", onCreated);
      socket.off("server:session:messages", onMessages);
      socket.off("server:session:run:event", onRunEvent);
      socket.off("server:session:run:finished", onFinished);
      socket.off("server:session:error", onError);
      socket.off("server:tool:hitl", onHitl);
      socket.off("server:tool:ran", onToolRan);
      socket.off("server:tool:exec:log", onExecLog);
      socket.off("server:tool:exec:done", onExecDone);
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
    if (id && getSocket().connected) ChangeFocus(id);
    if (id && !loadedRef.current.has(id) && getSocket().connected) {
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

  const dismissNotice = React.useCallback(() => setNotice(null), []);

  const respond = React.useCallback(
    (approved: boolean) => {
      if (!pendingApproval) return;
      RespondApproval(pendingApproval.approvalId, approved);
      setPendingApproval(null);
    },
    [pendingApproval],
  );

  const messages = threads[activeId ?? DRAFT] ?? EMPTY;
  const loading = activeId !== null && loadingId === activeId;
  const approval =
    pendingApproval && pendingApproval.sessionId === (activeId ?? DRAFT)
      ? pendingApproval
      : null;

  const value = React.useMemo<ChatContextValue>(
    () => ({
      sessions,
      activeId,
      messages,
      status,
      loading,
      connected,
      notice,
      approval,
      respond,
      send,
      select,
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
      approval,
      respond,
      send,
      select,
      dismissNotice,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
