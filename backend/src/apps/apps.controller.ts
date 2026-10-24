import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AppsService } from './apps.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../common/guards/admin.guard';

@ApiTags('apps')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('apps')
export class AppsController {
  constructor(private appsService: AppsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las apps/módulos registrados en BD' })
  findAll() { return this.appsService.findAll(); }

  @Get('system-modules')
  @ApiOperation({ summary: 'Ver los módulos del nuevo sistema (fuente de verdad)' })
  findSystemModules() { return this.appsService.findSystemModules(); }

  @Post('sync')
  @ApiOperation({ summary: 'Sincronizar módulos del sistema en sec_apps' })
  sync() { return this.appsService.syncModules(); }

  @Delete(':name')
  @ApiOperation({ summary: 'Eliminar una app/módulo registrado' })
  remove(@Param('name') name: string) { return this.appsService.remove(name); }
}
