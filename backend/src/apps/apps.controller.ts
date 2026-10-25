import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AppsService } from './apps.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../common/guards/admin.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';

@ApiTags('apps')
@ApiBearerAuth()
@RequirePermission('seguridad.aplicaciones:access')
@Controller('apps')
export class AppsController {
  constructor(private appsService: AppsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las apps/módulos registrados en BD' })
  findAll() { return this.appsService.findAll(); }

  @Get('system-modules')
  @ApiOperation({ summary: 'Ver los módulos del nuevo sistema (fuente de verdad)' })
  findSystemModules() { return this.appsService.findSystemModules(); }

  // Modificar el registro de módulos sigue siendo solo para administradores
  @Post('sync')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Sincronizar módulos del sistema en sec_apps (solo administradores)' })
  sync() { return this.appsService.syncModules(); }

  @Delete(':name')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Eliminar una app/módulo registrado (solo administradores)' })
  remove(@Param('name') name: string) { return this.appsService.remove(name); }
}
