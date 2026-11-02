import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

console.log("Websocket running on port 4321");

socket.on("connect", () => {
  console.log("Connected", socket.id);

  socket.emit("session:run", {
    sessionId: "224b65f4-22bf-4906-b2cc-ab29e9eba39c",
    query: "Whay is my name",
  });
});

socket.on("session:event", (event) => {
  if (event.type === "text-delta") {
    process.stdout.write(event.delta);
  } else {
    console.log("\nEvent:", event);
  }
});

socket.on("session:initiated", async (data) => {
  console.log("Session Iniitated", data.sessionId);
});

socket.on("session:started", (data) => {
  console.log("Session Started", data.sessionId);
});
