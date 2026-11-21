import { Module } from "@nestjs/common";
import { DockerService } from "./docker/docker.service";
import { SandboxService } from "./sandbox.service";

@Module({
  providers: [DockerService, SandboxService],
  exports: [SandboxService],
  imports: [],
})
export class SandBoxModule { }
