import type OpenAI from "openai";
import { allowedList, ToolRegistry } from "./tools.registry";
import { Socket } from "socket.io";
import { pending } from "../llm.openai";
import { ClientToServerEvents, ServerToClientEvents } from "@repo/shared";
import { createSandbox } from "./sandbox_tools/tools";

export const ToolResolver = (
  list: Array<keyof typeof ToolRegistry>,
): Array<OpenAI.Responses.Tool> => {
  return list
    .filter((i) => allowedList[i] === "core")
    .map((i): OpenAI.Responses.FunctionTool => {
      const tool = ToolRegistry[i];
      return {
        type: "function",
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
        strict: true,
      };
    });
};

export const executor = async (
  name: keyof typeof ToolRegistry,
  sessionId: string,
  socket: Socket,
  args: string,
) => {
  const tool = ToolRegistry[name];

  if (!tool) {
    return { ok: false, error: `Tool "${name}" not found in ToolRegistry` };
  }

  if (!tool.execute) {
    return { ok: false, error: `Tool "${name}" has no execute function` };
  }

  let json: unknown;

  try {
    json = JSON.parse(args);
  } catch {
    return { ok: false, error: "Arguments are not valid JSON" };
  }

  const parsedArgs = tool.inputSchema.safeParse(json);

  if (!parsedArgs.success) {
    return {
      ok: false,
      error: `Invalid arguments: ${parsedArgs.error.message}`,
    };
  }

  // HITL - Human in the loop
  if (NEEDS_APPROVAL.has(tool.name)) {
    const ok = await requestApproval(socket, sessionId, {
      name: tool.name,
      description: tool.description as string,
      args: parsedArgs.data,
    });

    if (!ok) {
      return { ok: false, error: "User rejected this action" };
    }
  }

  try {
    const output = await tool.execute(parsedArgs.data as never);
    return { ok: true, output };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
};

const requestApproval = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  sessionId: string,
  tool: { name: string; description: string; args: unknown },
) => {
  const approvalId = crypto.randomUUID();

  socket.emit("server:tool:hitl", {
    approvalId,
    tool: {
      name: tool.name,
      description: tool.description,
      args: tool.args,
    },
  });

  return new Promise<boolean>((resolve) => {
    pending.set(approvalId, {
      resolve,
      sessionId,
    });

    setTimeout(() => {
      if (pending.delete(approvalId)) resolve(false);
    }, 5 * 60_000);
  });
};

export const NEEDS_APPROVAL = new Set([createSandbox.name]);
