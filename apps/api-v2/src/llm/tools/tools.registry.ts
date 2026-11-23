import { weather } from "./tools.sample";

export const ToolRegistry = {
  getWeather: weather,
};

export const executor = (name: keyof typeof ToolRegistry, args: string) => {
  const tool = ToolRegistry[name];

  const parsedArgs = tool.inputSchema.safeParse(JSON.parse(args));

  if (!parsedArgs.success) {
    throw new Error(`Invalid arguments: ${parsedArgs.error.message}`);
  }

  return tool.execute(parsedArgs.data);
};
