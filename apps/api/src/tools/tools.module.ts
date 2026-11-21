import { Module } from "@nestjs/common";
import { SandBoxModule } from "../sandbox/sandbox.module";
import { ToolsService } from "./tools.service";
import { ToolRegistry } from "./tool_registry.service";
import { DockerTools } from "./docker/docker.tools";
import { WebTools } from "./web/web.tools";

@Module({
	imports: [SandBoxModule],
	providers: [ToolsService, ToolRegistry, DockerTools, WebTools],
	exports: [ToolsService, ToolRegistry],
})
export class ToolsModule {}
