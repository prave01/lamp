import { Module } from "@nestjs/common";
import { DockerService } from "./docker/docker.service";

@Module({
  providers: [DockerService],
  imports: [],
})
export class SandBoxModule { }
