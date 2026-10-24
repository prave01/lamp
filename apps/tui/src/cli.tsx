import { Box, render, Text } from "ink";

function App() {
  return (
    <Box flexDirection="column" padding={1}>
      <Text color="green" bold>
        Agent Builder
      </Text>
      <Text>Waiting for agent...</Text>
    </Box>
  );
}

render(<App />);
