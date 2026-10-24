import { Controller, Get, Param, Query } from '@nestjs/common';
import { VentasService } from './ventas.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('ventas')
@ApiBearerAuth()
@Controller('ventas')
export class VentasController {
  constructor(private ventasService: VentasService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar ventas con filtros y paginación',
    description:
      'Retorna un UNION de Transactions (tarjeta) + TransactionQr. ' +
      'Todos los filtros son opcionales.',
  })
  @ApiQuery({ name: 'modeloPos',      required: false, description: 'Modelo de terminal (ej: PAX, NEWPOS)' })
  @ApiQuery({ name: 'tipoTarjeta',    required: false, description: 'Tipo tarjeta / Label' })
  @ApiQuery({ name: 'referencia',     required: false })
  @ApiQuery({ name: 'tid',            required: false, description: 'Terminal ID' })
  @ApiQuery({ name: 'mid',            required: false, description: 'Merchant ID' })
  @ApiQuery({ name: 'numAprobacion',  required: false, description: 'Número de aprobación' })
  @ApiQuery({ name: 'numLote',        required: false, description: 'Número de lote' })
  @ApiQuery({ name: 'numTarjeta',     required: false, description: 'Número de tarjeta (enmascarado)' })
  @ApiQuery({ name: 'nombreComercio', required: false, description: 'Nombre del comercio' })
  @ApiQuery({ name: 'fechaDesde',     required: false, description: 'Fecha inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fechaHasta',     required: false, description: 'Fecha fin (YYYY-MM-DD)' })
  @ApiQuery({ name: 'page',           required: false, type: Number, description: 'Página (default: 1)' })
  @ApiQuery({ name: 'limit',          required: false, type: Number, description: 'Registros por página (default: 20, máx: 500)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de ventas + metadatos' })
  findAll(@Query() query: any) {
    return this.ventasService.findAll({
      modeloPos:      query.modeloPos,
      tipoTarjeta:    query.tipoTarjeta,
      tipoTransaccion: query.tipoTransaccion,
      referencia:     query.referencia,
      tid:            query.tid,
      mid:            query.mid,
      numAprobacion:  query.numAprobacion,
      numLote:        query.numLote,
      numTarjeta:     query.numTarjeta,
      nombreComercio: query.nombreComercio,
      fechaDesde:     query.fechaDesde,
      fechaHasta:     query.fechaHasta,
      page:           query.page  ? parseInt(query.page)  : undefined,
      limit:          query.limit ? parseInt(query.limit) : undefined,
    });
  }

  @Get('options/modelos')
  @ApiOperation({ summary: 'Obtener modelos de terminal' })
  getModelos() {
    return this.ventasService.getModelos();
  }

  @Get('options/tipos-transaccion/:modelo')
  @ApiOperation({ summary: 'Obtener tipos de transacción por modelo' })
  getTiposTransaccion(@Param('modelo') modelo: string) {
    return this.ventasService.getTiposTransaccion(modelo);
  }

  @Get('options/tipos-tarjeta')
  @ApiOperation({ summary: 'Obtener tipos de tarjeta disponibles' })
  getTiposTarjeta() {
    return this.ventasService.getTiposTarjeta();
  }

  @Get(':uuid/detalle')
  @ApiOperation({ summary: 'Detalle completo de una transacción por UUID' })
  @ApiParam({ name: 'uuid', description: 'UUID de la transacción' })
  @ApiResponse({ status: 200, description: 'Datos completos de la transacción' })
  findOne(@Param('uuid') uuid: string) {
    return this.ventasService.findOne(uuid);
  }

  @Get(':uuid/voucher')
  @ApiOperation({ summary: 'Obtener voucher HTML/PDF de una transacción por UUID' })
  @ApiParam({ name: 'uuid', description: 'UUID de la transacción' })
  @ApiResponse({ status: 200, description: 'HTML del voucher y PDF en base64' })
  getVoucher(@Param('uuid') uuid: string) {
    return this.ventasService.getVoucher(uuid);
  }
}
