import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  const prisma = {
    sc_log: { findMany: jest.fn().mockResolvedValue([{ username: 'admin' }, { username: 'ex-empleado' }]) },
    sec_users: { findMany: jest.fn().mockResolvedValue([{ login: 'admin', name: 'Administrador' }]) },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('lista los usuarios del registro, incluidos los que ya fueron eliminados', async () => {
    await expect(service.findUsers()).resolves.toEqual([
      { login: 'admin', name: 'Administrador' },
      { login: 'ex-empleado', name: null },
    ]);
  });
});
