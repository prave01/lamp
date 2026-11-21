"use client";

import { io } from "socket.io-client";

export const socket = io(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000",
);

function onConnect() {
  console.log("Connected to server with socket ID:", socket.id);
}

export function ConnectSocketClient() {
  socket.off("connect", onConnect);
  socket.on("connect", onConnect);

  return socket.id;
}

export function CreateSession(query: string) {
  socket.emit("session:create-session", {
    query,
  });
}

export function RunSession(sessionId: string, query: string) {
  socket.emit("session:run", {
    sessionId,
    query,
  });
}

export function ListSessions() {
  socket.emit("session:list");
}

export function GetMessages(sessionId: string) {
  socket.emit("session:get-messages", { sessionId });
}

export function DeleteSession(sessionId: string) {
  socket.emit("session:delete", { sessionId });
}

export function CloseSession(sessionId: string) {
  socket.emit("session:close", { sessionId });
}
