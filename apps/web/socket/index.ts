"use client";

import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@repo/shared";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const globalForSocket = globalThis as unknown as { __appSocket?: AppSocket };

// This module is re-evaluated on HMR/Fast Refresh. Close the previous
// connection so each reload doesn't leak a live socket.
if (globalForSocket.__appSocket) {
  globalForSocket.__appSocket.removeAllListeners();
  globalForSocket.__appSocket.disconnect();
  globalForSocket.__appSocket = undefined;
}

if (typeof window !== "undefined") {
  // Close explicitly on page reload/navigation away (also covers bfcache).
  window.addEventListener("pagehide", () => {
    globalForSocket.__appSocket?.disconnect();
  });
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) globalForSocket.__appSocket?.connect();
  });
}

export function getSocket(): AppSocket {
  if (!globalForSocket.__appSocket) {
    globalForSocket.__appSocket = io(
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001",
      { transports: ["websocket"] },
    );
  }
  return globalForSocket.__appSocket;
}

export function CreateSession(query: string) {
  getSocket().emit("client:session:create", { query });
}

export function RunSession(sessionId: string, query: string) {
  getSocket().emit("client:session:run", { sessionId, query });
}

export function ListSessions() {
  getSocket().emit("client:session:list");
}

export function RespondApproval(approvalId: string, approved: boolean) {
  getSocket().emit("client:tool:hitl", { approvalId, approved });
}

export function ChangeFocus(sessionId: string) {
  getSocket().emit("client:session:changeFocus", { sessionId });
}

export function GetMessages(sessionId: string) {
  getSocket().emit("client:session:messages", { sessionId });
}
