import { eq } from "drizzle-orm";
import { docker } from "..";
import { db } from "../../db";
import { agentContainerTable } from "../../db/db.schema";
import { getAgent } from "../../libs/db";
import type { ContainerEvent } from "./container.types";

export const startDockerEventListener = async () => {
  const stream = await docker.getEvents({
    filters: { type: ["container"], label: ["sandbox_id"] },
  });

  stream.on("data", async (chunk: Buffer) => {
    const string = chunk.toString();
    const data: ContainerEvent = JSON.parse(string);

    console.log("Docker event received", data.Action, data.Actor.Attributes);

    const agent = await getAgent(data.Actor.ID);

    if (!agent && data.Action === "create") {
      return;
    }

    if (agent)
      await db
        .update(agentContainerTable)
        .set({ status: data.Action })
        .where(eq(agentContainerTable.id, data.Actor.ID));
  });
};

export class ContainerError extends Error {
  constructor(
    message: string,
    public exitCode?: number | null,
  ) {
    super(message);
    this.name = "ContainerError";
  }
}

export const errMessage = (err: unknown) =>
  err instanceof Error ? err.message : String(err);

export async function getContainerOrThrow(id: string) {
  const agent = await getAgent(id);
  if (!agent) throw new ContainerError(`No agent container found for: ${id}`);
  return docker.getContainer(agent.id);
}
