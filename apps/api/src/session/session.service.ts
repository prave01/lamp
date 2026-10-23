import { Injectable, Logger } from "@nestjs/common";
import { OpenaiService } from "../openai/openai.service";
import z from "zod";

export const sessionSchema = z.object({
  sessionTitle: z.string().describe("The title of the session"),
  description: z.string().describe("Description about this session"),
});

export type SessionSchema = z.infer<typeof sessionSchema>;

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private openaiService: OpenaiService) { }

  async createSession(input: string) {
    const response = await this.openaiService.streamText({
      query:
        "Create a whatsapp agent that can automate customer care messages. The agent should be able to understand user queries, provide relevant responses, and handle common customer service tasks. The output should be structured in JSON format with the following fields: sessionTitle, description, and output.",
      sysPrompt:
        "You are a helpful assistant that can generate structured output based on user input. You will be provided with a user input and you need to generate a structured output in the form of a JSON object. The JSON object should contain the following fields: sessionTitle, description, output. The sessionTitle should be a concise title that summarizes the main topic of the user input. The description should provide a detailed explanation of the user input, including any relevant context or background information. The output should be in JSON format and should not contain any additional text or explanations.",
      model: "gpt-4o-mini",
      outputSchema: sessionSchema,
    });

    return response;
  }
}
