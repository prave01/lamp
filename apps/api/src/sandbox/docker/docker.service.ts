import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import Docker from "dockerode";

@Injectable()
export class DockerService implements OnModuleInit {
  private readonly logger = new Logger(DockerService.name);

  private readonly docker = new Docker({
    socketPath: process.env.DOCKER_SOCKET ?? "/var/run/docker.sock",
  });

  async onModuleInit() {
    try {
      await this.docker.ping();
      this.logger.log("Docker Engine connected");
    } catch (error) {
      this.logger.error("Docker Engine connection failed", error);
      throw error;
    }
  }

  async createContainer(options: Parameters<Docker["createContainer"]>[0]) {
    return this.docker.createContainer(options);
  }

  getContainer(id: string) {
    return this.docker.getContainer(id);
  }

  async startContainer(id: string) {
    const container = this.getContainer(id);
    await container.start();
    return container;
  }

  async stopContainer(id: string) {
    const container = this.getContainer(id);
    await container.stop({ t: 10 });
  }

  async removeContainer(id: string) {
    const container = this.getContainer(id);
    await container.remove({ force: true });
  }

  async inspectContainer(id: string) {
    return this.getContainer(id).inspect();
  }
}
