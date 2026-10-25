import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../common/decorators/require-permission.decorator';

@ApiTags('audit')
@ApiBearerAuth()
@RequirePermission('seguridad.auditoria:access')
@Controller('audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get('users')
  @ApiOperation({ summary: 'Usuarios con registros de auditoría (para el filtro), incluidos los eliminados' })
  findUsers() { return this.auditService.findUsers(); }

  @Get()
  @ApiOperation({ summary: 'Consultar logs de auditoría con filtros' })
  @ApiQuery({ name: 'username', required: false })
  @ApiQuery({ name: 'application', required: false })
  @ApiQuery({ name: 'action', required: false, enum: ['access','insert','update','delete','export'] })
  @ApiQuery({ name: 'from', required: false, description: 'Fecha inicio YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: false, description: 'Fecha fin YYYY-MM-DD' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query() query: any) {
    return this.auditService.findAll({
      username: query.username,
      application: query.application,
      action: query.action,
      from: query.from,
      to: query.to,
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
    });
  }
}
