import { Test, TestingModule } from "@nestjs/testing";
import { SandBoxController } from "./sandbox.controller";

describe("SandBoxController", () => {
  let controller: SandBoxController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SandBoxController],
    }).compile();

    controller = module.get<SandBoxController>(SandBoxController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
