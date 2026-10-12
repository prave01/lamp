import { Test, TestingModule } from '@nestjs/testing';
import { AgentRunnerController } from './agent-runner.controller';

describe('AgentRunnerController', () => {
  let controller: AgentRunnerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentRunnerController],
    }).compile();

    controller = module.get<AgentRunnerController>(AgentRunnerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
