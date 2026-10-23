import { Logger } from "@nestjs/common";
import { OpenaiService } from "../openai/openai.service";

export class SessionService {
  private readonly logger = new Logger(SessionService.name);
}
