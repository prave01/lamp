import z from "zod";
import { defineTool } from "./tools.defineTool";

export const WeatherSchema = z.object({
  location: z.string().describe("Location as a parameter"),
});

export const weather = defineTool({
  name: "getWeather",
  id: "weather-tool",
  description: "Get weather of the location",
  inputSchema: WeatherSchema,
  execute: ({ location }) => {
    return {
      location,
      temp: 28,
    };
  },
});
