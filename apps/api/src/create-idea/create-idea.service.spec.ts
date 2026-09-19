import { Test, TestingModule } from '@nestjs/testing';
import { CreateIdeaService } from './create-idea.service.js';

describe('CreateIdeaService', () => {
  let service: CreateIdeaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateIdeaService],
    }).compile();

    service = module.get<CreateIdeaService>(CreateIdeaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
