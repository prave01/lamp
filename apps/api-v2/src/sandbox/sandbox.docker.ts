import { db } from "../db/index";
import { getSession } from "../libs/db";
import { sandboxTable } from "../db/db.schema";
import { docker } from ".";

export const createSandboxNetwork = async (sessionId: string) => {
  try {
    const session = getSession(sessionId);

    if (!session) {
      throw new Error(`No session found for ${sessionId}`);
    }

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
        id: network.id,
        sessionId,
      })
      .returning({
        id: sandboxTable.id,
        status: sandboxTable.status,
      });

    network.inspect((_, result) => {
      console.log("Network inspection", result?.Name);
      console.log(result?.Labels);
    });

    return {
      sandboxId: sandbox?.id,
    };
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }

    throw new Error("Error while creating the sandbox");
  }
};

export const removeSandboxNetwork = async (sandboxId: string) => {
  await docker.getNetwork(sandboxId).remove(); // container must be removed first
};
