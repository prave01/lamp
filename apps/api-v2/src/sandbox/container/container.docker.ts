import { docker } from "..";
import type Dockerode from "dockerode";
import { ContainerEvent } from "./container.types";
import { db } from "../../db";
import { agentContainerTable } from "../../db/db.schema";
import { eq } from "drizzle-orm";
import { getAgent } from "../../libs/db";

export const createContainer = async (
  sandboxId: string,
  agentId: string,
  name: string,
  cmd: string[],
): Promise<Dockerode.Container> => {
  const container = await docker.createContainer({
    name,
    Image: `alpine:latest`,
    Labels: {
      sandbox_id: sandboxId,
      agent_id: agentId,
    },
    Cmd: cmd,
    HostConfig: {
      NetworkMode: sandboxId,
    },
  });

  console.log("Container created", container.id);

  return container;
};

export const startDockerEventListener = async () => {
  const stream = await docker.getEvents({
    filters: { type: ["container"], label: ["sandbox_id"] },
  });

  stream.on("data", async (chunk: Buffer) => {
    const string = chunk.toString();
    const data: ContainerEvent = JSON.parse(string);

    const agent = await getAgent(data.Actor.Attributes.agent_id);

    if (!agent) {
      console.warn("No agent found for:", data.Actor.Attributes.agent_id);
      return;
    }

    if (agent)
      await db
        .update(agentContainerTable)
        .set({ status: data.Action })
        .where(eq(agentContainerTable.agentId, data.Actor.Attributes.agent_id));
  });
};
