import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { parseDateParam, parsePagination } from '../common/utils/query-params';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: {
    username?: string;
    application?: string;
    action?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    // máximo 200 registros por página
    const { page, limit, offset: skip } = parsePagination(filters.page, filters.limit, { defaultLimit: 50, maxLimit: 200 });

    const where: Prisma.sc_logWhereInput = {};
    if (filters.username) where.username = { contains: filters.username, mode: 'insensitive' };
    if (filters.application) where.application = { contains: filters.application, mode: 'insensitive' };
    if (filters.action) where.action = filters.action;
    if (filters.from || filters.to) {
      const rango: Prisma.DateTimeNullableFilter = {};
      if (filters.from) rango.gte = new Date(parseDateParam(filters.from, 'from'));
      if (filters.to) {
        // "Hasta" incluye el día completo
        const hasta = new Date(parseDateParam(filters.to, 'to'));
        hasta.setUTCDate(hasta.getUTCDate() + 1);
        rango.lt = hasta;
      }
      where.inserted_date = rango;
    }

    const [data, total] = await Promise.all([
      this.prisma.sc_log.findMany({
        where,
        orderBy: { inserted_date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.sc_log.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
