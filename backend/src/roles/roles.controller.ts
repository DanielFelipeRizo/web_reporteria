import {
  Body, Controller, Delete, Get, Param, ParseIntPipe,
  Patch, Post, Put, UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../common/guards/admin.guard';
import { SaveRoleDto, UpdatePermissionsDto } from './dto/role.dto';

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los roles' })
  findAll() { return this.rolesService.findAll(); }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un rol por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) { return this.rolesService.findOne(id); }

  @Post()
  @ApiOperation({ summary: 'Crear nuevo rol' })
  create(@Body() body: SaveRoleDto) { return this.rolesService.create(body.description); }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar descripción de un rol' })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: SaveRoleDto) {
    return this.rolesService.update(id, body.description);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un rol y sus permisos' })
  remove(@Param('id', ParseIntPipe) id: number) { return this.rolesService.remove(id); }

  @Get(':id/permissions')
  @ApiOperation({ summary: 'Ver permisos del rol por módulo' })
  getPermissions(@Param('id', ParseIntPipe) id: number) { return this.rolesService.getPermissions(id); }

  @Put(':id/permissions')
  @ApiOperation({ summary: 'Actualizar permisos del rol' })
  updatePermissions(@Param('id', ParseIntPipe) id: number, @Body() body: UpdatePermissionsDto) {
    return this.rolesService.updatePermissions(id, body.permissions);
  }
}
