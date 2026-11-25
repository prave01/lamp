import { createAgentContainer } from "./container_tools/tools";
import { createSandbox } from "./sandbox_tools/tools";
import { getCurrentActiveSession } from "./session_tools/tools.session";

export const ToolRegistry = {
  createSandbox,
  getActiveSession: getCurrentActiveSession,
  createAgentContainer,
};

export const allowedList: Record<keyof typeof ToolRegistry, "core" | "false"> =
{
  createSandbox: "core",
  getActiveSession: "core",
  createAgentContainer: "core",
};
