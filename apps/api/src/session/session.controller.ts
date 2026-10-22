import { Body, Controller, Logger, Post } from "@nestjs/common";
import { SessionService } from "./session.service";

@Controller("idea")
export class SessionController {
  private readonly logger = new Logger(SessionController.name);

  constructor(private readonly createIdeaService: SessionService) { }

  @Post("create-idea")
  async createIdea() {
    try {
    } catch (err) {
      if (err instanceof Error) {
        this.logger.error(err);
        throw new Error(err.message);
      }
      this.logger.error("Internal Server Error: 500");
      throw new Error("Internal Server Error: 500");
    }
  }
}
