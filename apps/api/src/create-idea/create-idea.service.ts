import { Injectable } from "@nestjs/common";

@Injectable()
export class CreateIdeaService {
  generateIdea() {
    return "This is a generated idea!";
  }
}
