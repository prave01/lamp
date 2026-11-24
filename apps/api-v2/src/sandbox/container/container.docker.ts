import { docker } from "..";
import type Dockerode from "dockerode";

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
