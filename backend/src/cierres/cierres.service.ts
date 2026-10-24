import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { parseDateParam, parsePagination } from '../common/utils/query-params';

export interface CierresFilter {
  modeloPos?:      string;
  tipoTransaccion?: string;
  nombreComercio?: string;
  mid?:            string;
  tid?:            string;
  lote?:           string;
  fechaDesde?:     string;
  fechaHasta?:     string;
  page?:           number;
  limit?:          number;
}

@Injectable()
export class CierresService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: CierresFilter) {
    const { page, limit, offset: skip } = parsePagination(filters.page, filters.limit);

    // ── Construir filtros con Prisma ORM (sin SQL raw) ─────────────────────
    const where: Prisma.CierreTransaccionWhereInput = {};

    if (filters.modeloPos)
      where.MODELOPOS = { contains: filters.modeloPos, mode: 'insensitive' };

    if (filters.tipoTransaccion) {
      const tipo = Number(filters.tipoTransaccion);
      if (!Number.isInteger(tipo))
        throw new BadRequestException('tipoTransaccion debe ser un número entero');
      where.Cierre_TypeTrx = tipo;
    }

    if (filters.nombreComercio)
      where.Merchant_Name = { contains: filters.nombreComercio, mode: 'insensitive' };

    if (filters.mid)
      where.Merchant_MID = { contains: filters.mid, mode: 'insensitive' };

    if (filters.tid)
      where.Merchant_TID = { contains: filters.tid, mode: 'insensitive' };

    if (filters.lote)
      where.Cierre_Lot = { contains: filters.lote, mode: 'insensitive' };

    if (filters.fechaDesde || filters.fechaHasta) {
      const rango: Prisma.DateTimeFilter = {};
      if (filters.fechaDesde)
        rango.gte = new Date(parseDateParam(filters.fechaDesde, 'fechaDesde'));
      if (filters.fechaHasta) {
        // "Hasta" incluye el día completo: menor que el día siguiente a medianoche
        const hasta = new Date(parseDateParam(filters.fechaHasta, 'fechaHasta'));
        hasta.setUTCDate(hasta.getUTCDate() + 1);
        rango.lt = hasta;
      }
      where.Cierre_Date = rango;
    }

    // ── Ejecutar conteo y datos en paralelo ────────────────────────────────
    const [total, data] = await Promise.all([
      this.prisma.cierreTransaccion.count({ where }),
      this.prisma.cierreTransaccion.findMany({
        where,
        select: {
          Cierre_id:         true,
          Cierre_TerminalID: true,
          Cierre_Lot:        true,
          Cierre_Date:       true,
          Cierre_TypeTrx:    true,
          Cierre_TypeCierre: true,
          Cierre_Totales:    true,
          Cierre_Batch:      true,
          Merchant_Email:    true,
          Merchant_Name:     true,
          Merchant_Address:  true,
          Merchant_Phone:    true,
          Merchant_City:     true,
          Merchant_MID:      true,
          Merchant_TID:      true,
          Cierre_UUID:       true,
          MODELOPOS:         true,
        },
        orderBy: { Cierre_Date: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const sanitize = (obj: any) => JSON.parse(JSON.stringify(obj, (_, v) => typeof v === 'bigint' ? v.toString() : v));

    return {
      data: sanitize(data),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /** Detalle completo de un cierre por UUID */
  findOne(uuid: string) {
    return this.prisma.cierreTransaccion.findFirst({
      where: { Cierre_UUID: uuid },
    });
  }

  /** Voucher HTML del cierre por UUID */
  getVoucher(uuid: string) {
    return this.prisma.htmls_merchants.findFirst({
      where:  { UUID: uuid },
      select: {
        html_voucher:   true,
        pdf_base64:     true,
        type_trx:       true,
        insertion_date: true,
      },
    });
  }

  /** Tipos de Cierre dinámicos por modelo */
  async getTiposCierre(modelo: string) {
    return this.prisma.$queryRaw`
      SELECT id_transac, descripcion 
      FROM "TypeCierre" 
      WHERE "modeloTerminal" = ${modelo}
    `;
  }
}
