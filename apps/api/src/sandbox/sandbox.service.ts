import { Injectable } from "@nestjs/common";
import { DockerService } from "./docker/docker.service";
import { db } from "../database";
import {
  sandboxTable,
  workflowTable,
  workflowVersionTable,
} from "../database/schema";
import { eq } from "drizzle-orm";

@Injectable()
export class SandboxService {
  constructor(private readonly dockerService: DockerService) { }

  async createSandbox(sessionId: string) {
    const [sandbox] = await db
      .insert(sandboxTable)
      .values({
        sessionId,
      })
      .returning({
        id: sandboxTable.id,
      });

    return sandbox;
  }

  async createWorkflow(
    sandboxId: string,
    options: {
      name: string;
      version: string;
      descrption?: string;
      containerId: string;
      containerStatus: string;
    },
  ) {
    const [workflow] = await db
      .insert(workflowTable)
      .values({
        name: options.name,
        containerId: options.containerId,
        description: options.descrption ?? "nothing",
        containerStatus: options.containerStatus,
        sandboxId,
      })
      .returning({
        id: workflowTable.id,
      });

    await db.insert(workflowVersionTable).values({
      description: options.descrption ?? "nothing",
      version: options.version,
      workflowId: workflow.id,
    });

    return workflow;
  }

  async createExecutableContainer(
    sandboxId: string,
    options: {
      name: string;
      image?: string;
      workingDir?: string;
      description: string;
    },
  ) {
    const [sandbox] = await db
      .select()
      .from(sandboxTable)
      .where(eq(sandboxTable.id, sandboxId))
      .limit(1);

    if (!sandbox) {
      throw new Error("Sandbox not found");
    }

    const container = await this.dockerService.createContainer({
      Image: options.image ?? "agent-runtime:latest",
      name: options.name,

      Cmd: ["sleep", "infinity"],

      WorkingDir: options.workingDir ?? "/workspace",

      Labels: {
        "app.managed-by": "agent-builder",
        "app.sandbox-id": sandboxId,
      },

      HostConfig: {
        Memory: 512 * 1024 * 1024,
        NanoCpus: 1_000_000_000,
        PidsLimit: 128,

        ReadonlyRootfs: true,
        CapDrop: ["ALL"],
        SecurityOpt: ["no-new-privileges:true"],

        NetworkMode: "none",

        Tmpfs: {
          "/tmp": "rw,noexec,nosuid,size=64m",
          "/workspace": "rw,nosuid,size=256m",
        },
      },
    });

    await container.start();

    const workflow = await this.createWorkflow(sandboxId, {
      name: options.name,
      containerId: container.id,
      containerStatus: "running",
      version: `v1`,
      descrption: options.description,
    });

    return workflow;
  }
}
