import OpenAI from "openai";
import { weather } from "./tools.sample";

export const ToolRegistry = {
  getWeather: weather,
};

export const allowedList: Record<keyof typeof ToolRegistry, "core" | "false"> =
{
  getWeather: "core",
};
