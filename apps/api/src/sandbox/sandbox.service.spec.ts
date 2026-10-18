import { Test, TestingModule } from "@nestjs/testing";
import { SandBoxService } from "./sandbox.service";

describe("AgentRunnerService", () => {
  let service: SandBoxService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SandBoxService],
    }).compile();

    service = module.get<SandBoxService>(SandBoxService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
