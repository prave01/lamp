import { ResponseStreamEvent } from "openai/resources/responses/responses.js";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

const session = "8477f5ff-e333-4d9d-9775-7fc98f0514e7";

socket.on("connect", async () => {
  console.log("Connected", socket.id);

  // await socket.emit("session:create-session", {
  //   query: "Create a agent that can connect my hubspot",
  // });

  await socket.emit("session:create_instance", {
    sessionId: session,
  });
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
      console.log(event.type);
      console.log(event.item_id);
      console.log(event.arguments);
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

socket.on("session:initiated", async (data) => {
  console.log("Session Iniitated", data.sessionId);

  socket.emit("session:run", {
    sessionId: session,
    query: "what is my name?",
  });
});
