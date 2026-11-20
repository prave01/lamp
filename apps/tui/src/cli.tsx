import { Box, render, Text, useInput, useStdout } from "ink";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  useEffect(() => {
    socket.on("connect", async () => {
      console.log("Connected", socket.id);
    });

    socket.emit("session:create-session", {
      query: "Create a whatsapp sales agent that can talk to customers",
    });
  }, []);

  socket.on("session:created", (data) => {
    console.log("session create", data.sessionId);
    socket.emit("session:run", {
      sessionId: data.sessionId,
      query: "hi there",
    });
  });

  socket.on("session:event", (event) => {
    switch (event.type) {
      case "response.output_text.delta":
        setOutput((prev) => prev + event.delta);
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

  useInput((char, key) => {
    if (char) {
      setInput((prev) => prev + char);
    }

    if (key.backspace || key.delete) {
      setInput((prev) => prev.slice(0, -1));
      return;
    }
  });

  const { stdout } = useStdout();

  return (
    <Box
      flexDirection="column"
      alignItems="flex-start"
      justifyContent="flex-start"
      borderColor={"yellow"}
      height={stdout.rows}
    >
      <Box
        flexDirection="column"
        flexGrow={1}
        flexShrink={1}
        width={"100%"}
        borderStyle={"single"}
        borderColor={"yellow"}
      >
        <Box paddingLeft={1}>
          <Text color={"yellow"} underline bold>
            Welcome to the Agent Builder
          </Text>
        </Box>

        <Box paddingLeft={2} marginTop={1}>
          <Text color={"blue"}>AI:</Text>
        </Box>
        <Box paddingLeft={3} marginTop={1}>
          <Text color={"white"}>{output}</Text>
        </Box>
      </Box>

      <Box
        width={"100%"}
        paddingLeft={1}
        borderStyle={"single"}
        borderTopColor={"yellow"}
      >
        <Text>{input}</Text>
        <Text color="green">_</Text>
      </Box>
    </Box>
  );
}

render(<App />);
