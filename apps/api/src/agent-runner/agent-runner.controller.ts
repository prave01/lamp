import { Body, Controller, Post } from '@nestjs/common';
import { AgentRunnerService } from './agent-runner.service';

@Controller('agent-runner')
export class AgentRunnerController {
  constructor(private readonly agentRunnerService: AgentRunnerService) { }

  @Post('sample-run')
  async sampleRun(
    @Body()
    body: any,
  ) {
    try {
      const res = await this.agentRunnerService.run();
      return res;
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('Internal Server Error: 500');
    }
  }
}
