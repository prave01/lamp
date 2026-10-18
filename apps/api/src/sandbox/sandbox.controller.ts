import { Body, Controller, Post } from '@nestjs/common';
import { SandBoxService } from './sandbox.service';

@Controller('agent-runner')
export class SandBoxController {
  constructor(private readonly agentRunnerService: SandBoxService) { }

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
