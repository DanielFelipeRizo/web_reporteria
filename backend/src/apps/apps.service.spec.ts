import { Test, TestingModule } from '@nestjs/testing';
import { AppsService } from './apps.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AppsService', () => {
  let service: AppsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppsService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<AppsService>(AppsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
