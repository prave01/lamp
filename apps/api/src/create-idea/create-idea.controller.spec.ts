import { Test, TestingModule } from '@nestjs/testing';
import { CreateIdeaController } from './create-idea.controller.js';

describe('CreateIdeaController', () => {
  let controller: CreateIdeaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreateIdeaController],
    }).compile();

    controller = module.get<CreateIdeaController>(CreateIdeaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
