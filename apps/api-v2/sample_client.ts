import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@repo/shared";

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  "http://localhost:4001",
);

const session = "fc89eac8-9365-42da-9abd-2c8e55903643";

socket.on("connect", async () => {
  socket.emit("session:create", { query: "Create whatsapp agent" });
});

socket.on("session:created", ({ sessionId, title, descrption }) => {
  console.log("SessionId", sessionId);
  console.log("Title:", title);
  console.log("Description:", descrption);

  // run session
  socket.emit("session:run", {
    query: "use the weather tool and find what is the weather at tamilnadu",
    sessionId,
  });
});

socket.on("session:run:event", ({ text_delta }) => {
  process.stdout.write(text_delta);
});
