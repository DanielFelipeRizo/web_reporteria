import { Test, TestingModule } from '@nestjs/testing';
import { CierresController } from './cierres.controller';
import { CierresService } from './cierres.service';

describe('CierresController', () => {
  let controller: CierresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CierresController],
      providers: [{ provide: CierresService, useValue: {} }],
    }).compile();

    controller = module.get<CierresController>(CierresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
