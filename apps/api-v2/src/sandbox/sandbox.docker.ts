import Docker from "dockerode";
import { db } from "../db/index";
import { getSession } from "../libs/db";
import { sandboxTable } from "../db/db.schema";

export const createSandboxNetwork = async (sessionId: string) => {
  try {
    const session = getSession(sessionId);

    if (!session) {
      throw new Error(`No session found for ${sessionId}`);
    }

    const docker = new Docker({
      socketPath: "/var/run/docker.sock",
    });

    const network = await docker.createNetwork({
      Name: `sandbox-${sessionId}`,
      Driver: "bridge",
      Internal: false,
      Labels: {
        sessionId,
      },
    });

    console.log("Sandbox created", network.id);

    const [sandbox] = await db
      .insert(sandboxTable)
      .values({
        sandboxId: network.id,
        sessionId,
      })
      .returning({
        sandboxId: sandboxTable.sandboxId,
        status: sandboxTable.status,
      });

    network.inspect((_, result) => {
      console.log("Network inspection", result?.Name);
      console.log(result?.Labels);
    });

    return {
      sandboxId: sandbox?.sandboxId,
    };
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }

    throw new Error("Error while creating the sandbox");
  }
};
