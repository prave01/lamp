import { ResponseStreamEvent } from "openai/resources/responses/responses.js";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

const session = "6c4e9fc8-c507-4229-9b26-46a4a2fe6c8d";

socket.on("connect", () => {
  console.log("Connected", socket.id);

  socket.emit("session:create_instance", {
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

socket.on("session:initiated", async (data) => {
  console.log("Session Iniitated", data.sessionId);

  socket.emit("session:run", {
    sessionId: session,
    query:
      "Find the information about praveen thanikachalam by using the websearch tool",
  });
});
