import { ResponseStreamEvent } from "openai/resources/responses/responses.js";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

const session = "6c4e9fc8-c507-4229-9b26-46a4a2fe6c8d";

// socket.onAny((eventName, ...args) => {
//   console.log(`[IN] ${eventName}`, args);
// });
//
// socket.onAnyOutgoing((eventName, ...args) => {
//   console.log(`[OUT] ${eventName}`, args);
// });
//

socket.on("connect", async () => {
  console.log("Connected", socket.id);

  // socket.emit("session:delete", {
  //   sessionId: "8477f5ff-e333-4d9d-9775-7fc98f0514e7",
  // });

  // await socket.emit("session:create-session", {
  //   query: "Create a whatsapp sales agent that can talk to customers",
  // });
  await socket.emit("session:create_instance", {
    sessionId: session,
  });

  await socket.emit("session:run", {
    sessionId: session,
    query: "hi i am praveen",
  });
});

socket.on("session:deleted", (data) => {
  console.log("session deleted", data.sessionId);
});

socket.on("session:event", (event: ResponseStreamEvent) => {
  switch (event.type) {
    case "response.output_text.delta":
      process.stdout.write(event.delta);
      break;

    case "response.output_item.added":
      if (event.item.type === "function_call") {
        console.log("function call name", event.item.name);
      }
      break;

    case "response.function_call_arguments.done":
      console.log("response.function_call_arguments");
      break;
  }
});

socket.on("connection_failed", (event) => {
  console.log("session:error", event);
});

socket.on("session:error", (event) => {
  console.error({
    code: event.code,
    message: event.message,
    recoverable: event.recoverable,
  });
});

// socket.on("session:initiated", async (data) => {
//   console.log("Session Iniitated", data.sessionId);
//
//   socket.emit("session:run", {
//     sessionId: session,
//     query: "hi i am praveen",
//   });
// });
