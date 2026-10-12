import { Test, TestingModule } from '@nestjs/testing';
import { AgentRunnerService } from './agent-runner.service';

describe('AgentRunnerService', () => {
  let service: AgentRunnerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgentRunnerService],
    }).compile();

    service = module.get<AgentRunnerService>(AgentRunnerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
