import { tool } from "ai";
import z, { ZodType } from "zod";
import { toOpenAITool } from ".";

const WeatherSchema = z.object({
  location: z.string().describe("City name"),
  unit: z.enum(["celsius", "fahrenheit"]),
});

export const weather = {
  name: "get_weather",
  schema: WeatherSchema,
  ...tool({
    description: "Get the current weather of a location",
    inputSchema: WeatherSchema,
    execute: ({ location, unit }) => {
      return {
        location,
        temp: 28,
        unit,
      };
    },
  }),
};

export const tools = [
  toOpenAITool({
    name: weather.name,
    description: weather.description as string,
    schema: weather.inputSchema as ZodType,
  }),
];

export const executeTool = (tool: typeof weather, args: string) => {
  const parsedArgs = tool.schema.parse(JSON.parse(args));

  return tool.execute();
};
