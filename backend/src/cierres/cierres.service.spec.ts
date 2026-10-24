import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CierresService } from './cierres.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CierresService', () => {
  let service: CierresService;
  const prisma = {
    cierreTransaccion: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
  const ultimaConsulta = () => prisma.cierreTransaccion.findMany.mock.calls.at(-1)[0];

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [CierresService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<CierresService>(CierresService);
  });

  it('incluye el día completo en fechaHasta', async () => {
    await service.findAll({ fechaDesde: '2026-10-16', fechaHasta: '2026-10-16' });

    expect(ultimaConsulta().where.Cierre_Date).toEqual({
      gte: new Date('2026-10-16T00:00:00Z'),
      lt:  new Date('2026-10-17T00:00:00Z'),
    });
  });

  it('usa la paginación por defecto si page y limit son inválidos', async () => {
    await service.findAll({ page: NaN, limit: -5 });

    expect(ultimaConsulta()).toMatchObject({ skip: 0, take: 20 });
  });

  it('filtra por tipo de transacción numérico', async () => {
    await service.findAll({ tipoTransaccion: '2' });

    expect(ultimaConsulta().where.Cierre_TypeTrx).toBe(2);
  });

  it.each([
    [{ tipoTransaccion: 'abc' }],
    [{ fechaDesde: 'ayer' }],
    [{ fechaHasta: '2026-02-31' }],
  ])('responde 400 con filtros inválidos %p', async (filtros) => {
    await expect(service.findAll(filtros)).rejects.toThrow(BadRequestException);
    expect(prisma.cierreTransaccion.findMany).not.toHaveBeenCalled();
  });
});
