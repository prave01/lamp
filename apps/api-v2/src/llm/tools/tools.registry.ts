import {
  createAgentContainer,
  execCommand,
  listSessionAgents,
} from "./container_tools/tools";
import { createSandbox } from "./sandbox_tools/tools";
import { getUserFocusingSession } from "./session_tools/tools.session";

export const ToolRegistry = {
  createSandbox,
  getUserFocusingSession,
  createAgentContainer,
  execCommand,
  listSessionAgents,
};

export const allowedList: Record<keyof typeof ToolRegistry, "core" | "false"> =
{
  createSandbox: "core",
  getUserFocusingSession: "core",
  createAgentContainer: "core",
  execCommand: "core",
  listSessionAgents: "core",
};
