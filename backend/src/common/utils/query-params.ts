import { BadRequestException } from '@nestjs/common';

const MAX_LIMIT = 500;

/**
 * Normaliza la paginación de los listados.
 * Valores ausentes, no numéricos o menores a 1 toman el valor por defecto.
 */
export function parsePagination(page?: number, limit?: number) {
  const safePage  = Number.isInteger(page)  && page!  > 0 ? page!  : 1;
  const safeLimit = Number.isInteger(limit) && limit! > 0 ? Math.min(limit!, MAX_LIMIT) : 20;
  return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
}

/** Valida un filtro de fecha YYYY-MM-DD; responde 400 si no es una fecha real */
export function parseDateParam(value: string, name: string): string {
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !isNaN(Date.parse(value))
    && new Date(value).toISOString().slice(0, 10) === value;

  if (!valid) throw new BadRequestException(`${name} debe ser una fecha con formato YYYY-MM-DD`);
  return value;
}
