import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

console.log("Websocket running on port 4321");

socket.on("connect", () => {
  console.log("Connected", socket.id);

  socket.emit("session:create_instance", {
    sessionId: "51928e2c-06ec-45b1-9db6-cfb9ef87f6dd",
  });
});

socket.on("session:event", (event) => {
  if (event.type === "text-delta") {
    process.stdout.write(event.delta);
  } else {
    console.log("\nEvent:", event);
  }
});

socket.on("session:initiated", (data) => {
  console.log("Session Iniitated", data.sessionId);

  socket.emit("session:run", {
    sessionId: "51928e2c-06ec-45b1-9db6-cfb9ef87f6dd",
    query: "I am praveen",
  });
});
