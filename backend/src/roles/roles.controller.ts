import {
  Body, Controller, Delete, Get, Param, ParseIntPipe,
  Patch, Post, Put,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentActor } from '../common/decorators/current-actor.decorator';
import type { Actor } from '../common/permissions/permissions';
import { SaveRoleDto, UpdatePermissionsDto } from './dto/role.dto';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  // La pantalla de usuarios también lista los roles para asignarlos
  @Get()
  @RequirePermission('seguridad.roles:access', 'seguridad.usuarios:access')
  @ApiOperation({ summary: 'Listar todos los roles' })
  findAll() { return this.rolesService.findAll(); }

  @Get(':id')
  @RequirePermission('seguridad.roles:access')
  @ApiOperation({ summary: 'Obtener un rol por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) { return this.rolesService.findOne(id); }

  @Post()
  @RequirePermission('seguridad.roles:insert')
  @ApiOperation({ summary: 'Crear nuevo rol' })
  create(@Body() body: SaveRoleDto) { return this.rolesService.create(body.description); }

  @Patch(':id')
  @RequirePermission('seguridad.roles:update')
  @ApiOperation({ summary: 'Editar descripción de un rol' })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: SaveRoleDto, @CurrentActor() actor: Actor) {
    return this.rolesService.update(id, body.description, actor);
  }

  @Delete(':id')
  @RequirePermission('seguridad.roles:delete')
  @ApiOperation({ summary: 'Eliminar un rol y sus permisos' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentActor() actor: Actor) {
    return this.rolesService.remove(id, actor);
  }

  @Get(':id/permissions')
  @RequirePermission('seguridad.roles:access')
  @ApiOperation({ summary: 'Ver permisos del rol por módulo' })
  getPermissions(@Param('id', ParseIntPipe) id: number) { return this.rolesService.getPermissions(id); }

  @Put(':id/permissions')
  @RequirePermission('seguridad.roles:update')
  @ApiOperation({ summary: 'Actualizar permisos del rol (solo se otorgan permisos que uno tiene)' })
  updatePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePermissionsDto,
    @CurrentActor() actor: Actor,
  ) {
    return this.rolesService.updatePermissions(id, body.permissions, actor);
  }
}
