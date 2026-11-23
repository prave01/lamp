"use client";

import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@repo/shared";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001",
);

export function CreateSession(query: string) {
  socket.emit("client:session:create", { query });
}

export function RunSession(sessionId: string, query: string) {
  socket.emit("client:session:run", { sessionId, query });
}

export function ListSessions() {
  socket.emit("client:session:list");
}

export function GetMessages(sessionId: string) {
  socket.emit("client:session:messages", { sessionId });
}
