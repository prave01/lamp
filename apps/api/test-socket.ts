import { io } from "socket.io-client";
import { queryObjects } from "v8";

const socket = io("http://localhost:3000");

console.log("Websocket running on port 4321");

socket.on("connect", () => {
  console.log("Connected", socket.id);

  // 6c4e9fc8-c507-4229-9b26-46a4a2fe6c8d
  // 6c4e9fc8-c507-4229-9b26-46a4a2fe6c8d
  socket.emit("session:create_instance", {
    sessionId: "6c4e9fc8-c507-4229-9b26-46a4a2fe6c8d",
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

  await socket.emit("session:run", {
    sessionId: "6c4e9fc8-c507-4229-9b26-46a4a2fe6c8d",
    query: "I am praveen",
  });

  // await socket.emit("session:run", {
  //   sessionId: "51928e2c-06ec-45b1-9db6-cfb9ef87f6dd",
  //   query: "hi there can you say wat is 2+21",
  // });

  // await socket.emit("session:run", {
  //   sessionId: "6c4e9fc8-c507-4229-9b26-46a4a2fe6c8d",
  //   query: "what is my name",
  // });
});

socket.on("session:started", (data) => {
  console.log("Session Started", data.sessionId);
});
