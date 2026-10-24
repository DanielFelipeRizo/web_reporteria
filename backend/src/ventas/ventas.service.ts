import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { parseDateParam, parsePagination } from '../common/utils/query-params';

export interface VentasFilter {
  modeloPos?: string;
  tipoTarjeta?: string;
  tipoTransaccion?: string;
  referencia?: string;
  tid?: string;
  mid?: string;
  numAprobacion?: string;
  numLote?: string;
  numTarjeta?: string;
  nombreComercio?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class VentasService {
  constructor(private prisma: PrismaService) {}

  async getModelos() {
    return this.prisma.$queryRaw`SELECT model_descripcion FROM "ModeloTerminal" ORDER BY model_descripcion`;
  }

  async getTiposTransaccion(modelo: string) {
    return this.prisma.$queryRaw`SELECT "transacId", descripcion FROM "TypeTransacionModel" WHERE "modeloTerminal" = ${modelo} ORDER BY descripcion`;
  }

  async getTiposTarjeta() {
    return this.prisma.$queryRaw`
      SELECT DISTINCT T."Transac_Label" 
      FROM "Transactions" T 
      INNER JOIN "Merchants" M ON T."Transac_UUID" = M."merchant_UUID" 
      INNER JOIN "TypeTransaction" TY ON TY."Transact_id" = T."Transac_TypeTrx" 
      WHERE T."Transac_Label" NOT IN ('NA', '') AND T."Transac_Label" IS NOT NULL
      ORDER BY T."Transac_Label"
    `;
  }

  /**
   * Consulta unificada de ventas (Transactions regulares + QR).
   */
  async findAll(filters: VentasFilter) {
    const { page, limit, offset } = parsePagination(filters.page, filters.limit);

    // ── Construir condiciones WHERE dinámicas (valores como parámetros) ────
    const conditions: Prisma.Sql[] = [];
    const contains = (value: string) => `%${value}%`;

    if (filters.modeloPos)       conditions.push(Prisma.sql`modelo_pos = ${filters.modeloPos}`);
    if (filters.tipoTransaccion) conditions.push(Prisma.sql`tipo_trx_id = ${filters.tipoTransaccion}`);
    if (filters.tipoTarjeta)     conditions.push(Prisma.sql`label = ${filters.tipoTarjeta}`);
    if (filters.tid)             conditions.push(Prisma.sql`tid ILIKE ${contains(filters.tid)}`);
    if (filters.mid)             conditions.push(Prisma.sql`mid ILIKE ${contains(filters.mid)}`);
    if (filters.nombreComercio)  conditions.push(Prisma.sql`nombre_comercio ILIKE ${contains(filters.nombreComercio)}`);
    if (filters.referencia)      conditions.push(Prisma.sql`referencia ILIKE ${contains(filters.referencia)}`);
    if (filters.numAprobacion)   conditions.push(Prisma.sql`num_aprobacion ILIKE ${contains(filters.numAprobacion)}`);
    if (filters.numLote)         conditions.push(Prisma.sql`lote ILIKE ${contains(filters.numLote)}`);
    if (filters.numTarjeta)      conditions.push(Prisma.sql`num_tarjeta ILIKE ${contains(filters.numTarjeta)}`);
    if (filters.fechaDesde)      conditions.push(Prisma.sql`fecha_transaccion >= ${parseDateParam(filters.fechaDesde, 'fechaDesde')}::date`);
    // "Hasta" incluye el día completo
    if (filters.fechaHasta)      conditions.push(Prisma.sql`fecha_transaccion < ${parseDateParam(filters.fechaHasta, 'fechaHasta')}::date + 1`);

    const whereSQL = conditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.empty;

    // ── Query principal con UNION ALL (sin valores del usuario) ────────────
    const baseQuery = Prisma.raw(`
      SELECT
        TY."Transact_descripcion"     AS tipo_transaccion,
        M."merchant_Name"             AS nombre_comercio,
        M."merchant_City"             AS ciudad,
        T."Transac_Lot"               AS lote,
        M."merchant_TID"              AS tid,
        M."merchant_MID"              AS mid,
        T."Transac_NumCard"           AS num_tarjeta,
        T."Transac_Ref"               AS referencia,
        T."Transac_Aut"               AS num_aprobacion,
        T."Transac_AID"               AS aid,
        T."Transac_Label"             AS label,
        T."Transac_Date"              AS fecha_transaccion,
        T."Transac_UUID"              AS uuid,
        M."merchant_modeloPos"        AS modelo_pos,
        CAST(T."Transac_TypeTrx" AS VARCHAR(10)) AS tipo_trx_id,
        T."Transac_RESERVADO3"        AS estado_voucher,
        T."Transac_modo_caja"::TEXT   AS modo_caja,
        T."Transac_TIPO_SALE"         AS tipo_sale,
        CL."Tipo_Envio"               AS tipo_envio,
        NULL::VARCHAR                 AS tipo
      FROM "Transactions" T
      INNER JOIN "Merchants" M  ON T."Transac_UUID"  = M."merchant_UUID"
      INNER JOIN "TypeTransaction" TY ON TY."Transact_id" = T."Transac_TypeTrx"
      INNER JOIN "Client" CL    ON CL."Client_UUID"  = T."Transac_UUID"

      UNION ALL

      SELECT
        TQP."TipoTransaccionTitle"    AS tipo_transaccion,
        M."merchant_Name"             AS nombre_comercio,
        M."merchant_City"             AS ciudad,
        TQP."Res1"                    AS lote,
        M."merchant_TID"              AS tid,
        M."merchant_MID"              AS mid,
        TQP."Pan"                     AS num_tarjeta,
        TQP."Referencia"              AS referencia,
        TQP."NumeroAprobacion"        AS num_aprobacion,
        NULL::VARCHAR                 AS aid,
        NULL::VARCHAR                 AS label,
        TQP."DateTime"                AS fecha_transaccion,
        TQP."Uuid"                    AS uuid,
        M."merchant_modeloPos"        AS modelo_pos,
        TQP."TipoTransaccion"         AS tipo_trx_id,
        TQP."tipo_estado_transaction" AS estado_voucher,
        TQP."flag_modo_caja"          AS modo_caja,
        NULL::VARCHAR                 AS tipo_sale,
        CL."Tipo_Envio"               AS tipo_envio,
        TQP."Tipo"                    AS tipo
      FROM "TransactionQr" TQP
      INNER JOIN "Merchants" M  ON TQP."Uuid"        = M."merchant_UUID"
      INNER JOIN "Client" CL    ON CL."Client_UUID"  = TQP."Uuid"
    `);

    // Envolver en subconsulta para aplicar filtros y paginación de forma limpia
    const countQuery = Prisma.sql`
      SELECT COUNT(*) AS total
      FROM ( ${baseQuery} ) AS ventas
      ${whereSQL}
    `;

    const dataQuery = Prisma.sql`
      SELECT *
      FROM ( ${baseQuery} ) AS ventas
      ${whereSQL}
      ORDER BY fecha_transaccion DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [countResult, data] = await Promise.all([
      this.prisma.$queryRaw<{ total: bigint }[]>(countQuery),
      this.prisma.$queryRaw<any[]>(dataQuery),
    ]);

    const total = Number(countResult[0]?.total ?? 0);
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

  /** Detalle completo de una transacción por UUID */
  async findOne(uuid: string) {
    // Buscar en Transactions primero, luego en TransactionQr
    const trx = await this.prisma.$queryRaw<any[]>`
      SELECT
        T.*,
        M."merchant_Name"      AS nombre_comercio,
        M."merchant_City"      AS ciudad,
        M."merchant_TID"       AS tid,
        M."merchant_MID"       AS mid,
        M."merchant_Address"   AS direccion,
        M."merchant_Phone"     AS telefono,
        M."merchant_modeloPos" AS modelo_pos,
        TY."Transact_descripcion" AS tipo_transaccion,
        CL."Tipo_Envio"        AS tipo_envio
      FROM "Transactions" T
      INNER JOIN "Merchants" M  ON T."Transac_UUID" = M."merchant_UUID"
      INNER JOIN "TypeTransaction" TY ON TY."Transact_id" = T."Transac_TypeTrx"
      INNER JOIN "Client" CL    ON CL."Client_UUID" = T."Transac_UUID"
      WHERE T."Transac_UUID" = ${uuid}
      LIMIT 1
    `;

    const sanitize = (obj: any) => JSON.parse(JSON.stringify(obj, (_, v) => typeof v === 'bigint' ? v.toString() : v));

    if (trx.length > 0) return { source: 'transaction', data: sanitize(trx[0]) };

    // Buscar en QR
    const qr = await this.prisma.$queryRaw<any[]>`
      SELECT
        TQP.*,
        M."merchant_Name"      AS nombre_comercio,
        M."merchant_City"      AS ciudad,
        M."merchant_TID"       AS tid,
        M."merchant_MID"       AS mid,
        M."merchant_modeloPos" AS modelo_pos,
        CL."Tipo_Envio"        AS tipo_envio
      FROM "TransactionQr" TQP
      INNER JOIN "Merchants" M  ON TQP."Uuid" = M."merchant_UUID"
      INNER JOIN "Client" CL    ON CL."Client_UUID" = TQP."Uuid"
      WHERE TQP."Uuid" = ${uuid}
      LIMIT 1
    `;

    if (qr.length > 0) return { source: 'qr', data: sanitize(qr[0]) };

    return null;
  }

  /** Obtener voucher HTML por UUID */
  async getVoucher(uuid: string) {
    return this.prisma.htmls_merchants.findFirst({
      where: { UUID: uuid },
      select: {
        html_voucher: true,
        pdf_base64: true,
        type_trx: true,
        insertion_date: true,
      },
    });
  }
}
