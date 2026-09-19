import { Controller, Get, Post } from "@nestjs/common";
import { CreateIdeaService } from "./create-idea.service.js";

@Controller("ideas")
export class CreateIdeaController {
  constructor(private readonly createIdeaService: CreateIdeaService) { }

  @Get("generateIdea")
  getIdea(): string {
    const res = this.createIdeaService.generateIdea();
    return res;
  }
}
