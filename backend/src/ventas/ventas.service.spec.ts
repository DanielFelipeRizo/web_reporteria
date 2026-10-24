import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { VentasService } from './ventas.service';
import { PrismaService } from '../prisma/prisma.service';

const INYECCION = "x' OR '1'='1";

describe('VentasService', () => {
  let service: VentasService;
  const prisma = { $queryRaw: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [VentasService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<VentasService>(VentasService);
  });

  describe('findAll', () => {
    const consultas = () => prisma.$queryRaw.mock.calls.map(([sql]) => sql as Prisma.Sql);

    beforeEach(() => {
      prisma.$queryRaw.mockResolvedValueOnce([{ total: 1n }]).mockResolvedValueOnce([]);
    });

    it('envía los filtros como parámetros y no dentro del SQL', async () => {
      await service.findAll({ nombreComercio: INYECCION });

      const [conteo, datos] = consultas();
      expect(datos.sql).not.toContain(INYECCION);
      expect(conteo.sql).not.toContain(INYECCION);
      expect(datos.values).toEqual([`%${INYECCION}%`, 20, 0]);
      expect(conteo.values).toEqual([`%${INYECCION}%`]);
    });

    it('usa la paginación por defecto si page y limit son inválidos', async () => {
      const result = await service.findAll({ page: NaN, limit: -5 });

      expect(consultas()[1].values).toEqual([20, 0]);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });

    it('incluye el día completo en fechaHasta', async () => {
      await service.findAll({ fechaDesde: '2026-10-16', fechaHasta: '2026-10-16' });

      const [, datos] = consultas();
      expect(datos.sql).toContain('fecha_transaccion >= ?::date');
      expect(datos.sql).toContain('fecha_transaccion < ?::date + 1');
      expect(datos.values.slice(0, 2)).toEqual(['2026-10-16', '2026-10-16']);
    });

    it('responde 400 con una fecha inválida sin consultar la BD', async () => {
      prisma.$queryRaw.mockReset();

      await expect(service.findAll({ fechaDesde: "2026-10-16' OR 1=1--" })).rejects.toThrow(BadRequestException);
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('busca el UUID como parámetro, primero en tarjetas y luego en QR', async () => {
      prisma.$queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      const result = await service.findOne(INYECCION);

      expect(result).toBeNull();
      for (const [strings, ...valores] of prisma.$queryRaw.mock.calls) {
        expect((strings as string[]).join('')).not.toContain(INYECCION);
        expect(valores).toEqual([INYECCION]);
      }
    });
  });
});
