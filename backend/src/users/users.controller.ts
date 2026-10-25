import {
  Body, Controller, Delete, Get, Param,
  Patch, Post, Put, UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentActor } from '../common/decorators/current-actor.decorator';
import type { Actor } from '../common/permissions/permissions';
import { AssignRolesDto, CreateUserDto, SetPasswordDto, UpdateUserDto } from './dto/user.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @RequirePermission('seguridad.usuarios:access')
  @ApiOperation({ summary: 'Listar todos los usuarios' })
  findAll() { return this.usersService.findAll(); }

  @Post()
  @RequirePermission('seguridad.usuarios:insert')
  @ApiOperation({ summary: 'Crear nuevo usuario (password se hashea automáticamente)' })
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @Patch(':login')
  @RequirePermission('seguridad.usuarios:update')
  @ApiOperation({ summary: 'Editar datos del usuario (nombre, email, estado activo)' })
  update(
    @Param('login') login: string,
    @Body() body: UpdateUserDto,
    @CurrentActor() actor: Actor,
  ) {
    return this.usersService.update(login, body, actor);
  }

  @Delete(':login')
  @RequirePermission('seguridad.usuarios:delete')
  @ApiOperation({ summary: 'Eliminar usuario y sus relaciones (no se puede eliminar el propio)' })
  remove(@Param('login') login: string, @CurrentActor() actor: Actor) {
    return this.usersService.remove(login, actor);
  }

  @Patch(':login/password')
  @RequirePermission('seguridad.usuarios:update')
  @ApiOperation({ summary: 'Asignar contraseña nueva a un usuario' })
  changePassword(
    @Param('login') login: string,
    @Body() body: SetPasswordDto,
    @CurrentActor() actor: Actor,
  ) {
    return this.usersService.resetPassword(login, body.newPassword, actor);
  }

  // El formulario de creación asigna el rol justo después de crear el usuario
  @Put(':login/roles')
  @RequirePermission('seguridad.usuarios:update', 'seguridad.usuarios:insert')
  @ApiOperation({ summary: 'Asignar roles al usuario (reemplaza los actuales)' })
  assignRoles(@Param('login') login: string, @Body() body: AssignRolesDto, @CurrentActor() actor: Actor) {
    return this.usersService.assignRoles(login, body.groupIds, actor);
  }
}
