import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 50, 200); // máximo 200 registros por página
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.username) where.username = { contains: filters.username, mode: 'insensitive' };
    if (filters.application) where.application = { contains: filters.application, mode: 'insensitive' };
    if (filters.action) where.action = filters.action;
    if (filters.from || filters.to) {
      where.inserted_date = {};
      if (filters.from) where.inserted_date.gte = new Date(filters.from);
      if (filters.to) where.inserted_date.lte = new Date(filters.to);
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
