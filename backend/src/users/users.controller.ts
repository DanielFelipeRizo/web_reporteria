import {
  Body, Controller, Delete, Get, Param,
  Patch, Post, Put, UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../common/guards/admin.guard';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los usuarios' })
  findAll() { return this.usersService.findAll(); }

  @Post()
  @ApiOperation({ summary: 'Crear nuevo usuario (password se hashea automáticamente)' })
  create(@Body() body: { login: string; pswd: string; name?: string; email?: string; priv_admin?: string }) {
    return this.usersService.create(body);
  }

  @Patch(':login')
  @ApiOperation({ summary: 'Editar datos del usuario (nombre, email, estado activo)' })
  update(
    @Param('login') login: string,
    @Body() body: { name?: string; email?: string; usr_active?: string },
  ) {
    return this.usersService.update(login, body);
  }

  @Delete(':login')
  @ApiOperation({ summary: 'Eliminar usuario y sus relaciones' })
  remove(@Param('login') login: string) { return this.usersService.remove(login); }

  @Patch(':login/password')
  @ApiOperation({ summary: 'Cambiar contraseña de un usuario (solo Admin)' })
  changePassword(
    @Param('login') login: string,
    @Body() body: { newPassword: string },
  ) {
    return this.usersService.changePassword(login, body.newPassword);
  }

  @Put(':login/roles')
  @ApiOperation({ summary: 'Asignar roles al usuario (reemplaza los actuales)' })
  assignRoles(@Param('login') login: string, @Body() body: { groupIds: number[] }) {
    return this.usersService.assignRoles(login, body.groupIds);
  }
}
