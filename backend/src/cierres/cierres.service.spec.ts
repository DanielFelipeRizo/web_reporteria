import { Test, TestingModule } from '@nestjs/testing';
import { CierresService } from './cierres.service';

describe('CierresService', () => {
  let service: CierresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CierresService],
    }).compile();

    service = module.get<CierresService>(CierresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
