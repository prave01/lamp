import { Body, Controller, Logger, Post } from '@nestjs/common';
import { SessionSchema, SessionService } from './session.service';
import { OpenaiService } from '../openai/openai.service';
import { LLM_TOOL, ToolsResolver } from '../libs/tool';

@Controller('idea')
export class SessionController {
  private readonly logger = new Logger(SessionController.name);

  constructor(
    private readonly sessionService: SessionService,
    private readonly openaiservice: OpenaiService,
  ) { }

  @Post('create-session')
  async createIdea(
    @Body()
    input: {
      query: string;
    },
  ) {
    try {
      const res = await this.sessionService.createSession(
        'I wanna create a whatsapp agent that can automate my customer care message',
      );
      //
      //
      //

      this.logger.log({ input });

      const tools = ToolsResolver({
        agentId: 'core',
        tools: ['tool-websearch'],
      });

      const llm_tool = LLM_TOOL(tools);

      // const res = await this.openaiservice.streamText({
      //   sysPrompt:
      //     'You are a helpful assistant that can generate structured output based on user input. You will be provided with a user input and you need to generate a structured output in the form of a JSON object. The JSON object should contain the following fields: sessionTitle, description, output. The sessionTitle should be a concise title that summarizes the main topic of the user input. The description should provide a detailed explanation of the user input, including any relevant context or background information. The output should be in JSON format and should not contain any additional text or explanations.',
      //   model: 'gpt-4o-mini',
      //   query: input.query,
      //   agentId: 'core',
      //   name: 'core',
      //   tools: llm_tool,
      // });

      const data: SessionSchema = JSON.parse(res.text);

      this.logger.log({ output: data });

      return {
        title: data.sessionTitle,
        description: data.description,
      };
    } catch (err) {
      if (err instanceof Error) {
        this.logger.error(err);
        throw new Error(err.message);
      }
      this.logger.error('Internal Server Error: 500');
      throw new Error('Internal Server Error: 500');
    }
  }
}
