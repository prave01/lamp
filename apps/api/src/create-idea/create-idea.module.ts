import { Module } from "@nestjs/common";
import { CreateIdeaController } from "./create-idea.controller.js";
import { CreateIdeaService } from "./create-idea.service.js";

@Module({
  controllers: [CreateIdeaController],
  providers: [CreateIdeaService],
})
export class CreateIdeaModule {
  generateIdea() {
    return "This is a generated idea!";
  }
}
