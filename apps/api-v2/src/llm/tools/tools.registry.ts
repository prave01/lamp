import { createAgentContainer } from "./container_tools/tools";
import { createSandbox } from "./sandbox_tools/tools";
import { weather } from "./tools.sample";
import { getCurrentActiveSession } from "./tools.session";

export const ToolRegistry = {
  getWeather: weather,
  createSandbox,
  getActiveSession: getCurrentActiveSession,
  createAgentContainer,
};

export const allowedList: Record<keyof typeof ToolRegistry, "core" | "false"> =
{
  getWeather: "core",
  createSandbox: "core",
  getActiveSession: "core",
  createAgentContainer: "core",
};
