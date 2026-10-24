import { Controller, Get, Param, Query } from '@nestjs/common';
import { CierresService } from './cierres.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('cierres')
@ApiBearerAuth()
@Controller('cierres')
export class CierresController {
  constructor(private cierresService: CierresService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar cierres de transacción con filtros y paginación',
    description: 'Todos los filtros son opcionales.',
  })
  @ApiQuery({ name: 'modeloPos',      required: false, description: 'Modelo de terminal (MODELOPOS)' })
  @ApiQuery({ name: 'nombreComercio', required: false, description: 'Nombre del comercio' })
  @ApiQuery({ name: 'mid',            required: false, description: 'Merchant ID (MID)' })
  @ApiQuery({ name: 'tid',            required: false, description: 'Terminal ID (TID)' })
  @ApiQuery({ name: 'lote',           required: false, description: 'Número de lote' })
  @ApiQuery({ name: 'fechaDesde',     required: false, description: 'Fecha inicio del cierre (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fechaHasta',     required: false, description: 'Fecha fin del cierre (YYYY-MM-DD)' })
  @ApiQuery({ name: 'page',           required: false, type: Number, description: 'Página (default: 1)' })
  @ApiQuery({ name: 'limit',          required: false, type: Number, description: 'Registros por página (default: 20, máx: 500)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de cierres + metadatos' })
  findAll(@Query() query: any) {
    return this.cierresService.findAll({
      modeloPos:      query.modeloPos,
      tipoTransaccion: query.tipoTransaccion,
      nombreComercio: query.nombreComercio,
      mid:            query.mid,
      tid:            query.tid,
      lote:           query.lote,
      fechaDesde:     query.fechaDesde,
      fechaHasta:     query.fechaHasta,
      page:           query.page  ? parseInt(query.page)  : undefined,
      limit:          query.limit ? parseInt(query.limit) : undefined,
    });
  }

  @Get(':uuid/detalle')
  @ApiOperation({ summary: 'Detalle completo de un cierre por UUID' })
  @ApiParam({ name: 'uuid', description: 'UUID del cierre' })
  @ApiResponse({ status: 200, description: 'Todos los campos del cierre incluyendo totales y reservados' })
  findOne(@Param('uuid') uuid: string) {
    return this.cierresService.findOne(uuid);
  }

  @Get(':uuid/voucher')
  @ApiOperation({ summary: 'Obtener voucher HTML/PDF de un cierre por UUID' })
  @ApiParam({ name: 'uuid', description: 'UUID del cierre' })
  @ApiResponse({ status: 200, description: 'HTML del voucher y PDF en base64' })
  getVoucher(@Param('uuid') uuid: string) {
    return this.cierresService.getVoucher(uuid);
  }

  @Get('options/tipos-cierre/:modelo')
  @ApiOperation({ summary: 'Listar tipos de cierre por modelo de terminal' })
  @ApiParam({ name: 'modelo', description: 'Modelo de terminal (ej. NEW9220)' })
  getTiposCierre(@Param('modelo') modelo: string) {
    return this.cierresService.getTiposCierre(modelo);
  }
}
