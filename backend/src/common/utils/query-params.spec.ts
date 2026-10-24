import { BadRequestException } from '@nestjs/common';
import { parseDateParam, parsePagination } from './query-params';

describe('parsePagination', () => {
  it('usa página 1 y 20 registros por defecto', () => {
    expect(parsePagination()).toEqual({ page: 1, limit: 20, offset: 0 });
  });

  it('calcula el offset de la página pedida', () => {
    expect(parsePagination(3, 10)).toEqual({ page: 3, limit: 10, offset: 20 });
  });

  it.each([
    [NaN, NaN],
    [0, 0],
    [-2, -5],
    [1.5, 2.5],
  ])('ignora valores inválidos (page=%p, limit=%p)', (page, limit) => {
    expect(parsePagination(page, limit)).toEqual({ page: 1, limit: 20, offset: 0 });
  });

  it('limita la cantidad de registros por página', () => {
    expect(parsePagination(1, 9999).limit).toBe(500);
    expect(parsePagination(1, 9999, { maxLimit: 200 }).limit).toBe(200);
    expect(parsePagination(1, undefined, { defaultLimit: 50 }).limit).toBe(50);
  });
});

describe('parseDateParam', () => {
  it('acepta una fecha YYYY-MM-DD real', () => {
    expect(parseDateParam('2026-10-16', 'fechaDesde')).toBe('2026-10-16');
  });

  it.each(['abc', '2026-02-31', '16/10/2026', '2026-10-16 OR 1=1', ''])('rechaza %p con 400', (valor) => {
    expect(() => parseDateParam(valor, 'fechaDesde')).toThrow(BadRequestException);
  });
});
