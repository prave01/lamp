import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor() { }

  async generateIdea(input: any): Promise<string> {
    try {
      return "nothing";
    } catch (err) {
      if (err instanceof Error) throw new Error(err.message);
      throw new Error("Unkown error");
    }
  }
}
