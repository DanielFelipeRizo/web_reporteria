import {
  Body, Controller, Delete, Get, Param,
  Patch, Post, Put, UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../common/guards/admin.guard';
import { AssignRolesDto, CreateUserDto, SetPasswordDto, UpdateUserDto } from './dto/user.dto';

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
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @Patch(':login')
  @ApiOperation({ summary: 'Editar datos del usuario (nombre, email, estado activo)' })
  update(
    @Param('login') login: string,
    @Body() body: UpdateUserDto,
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
    @Body() body: SetPasswordDto,
  ) {
    return this.usersService.changePassword(login, body.newPassword);
  }

  @Put(':login/roles')
  @ApiOperation({ summary: 'Asignar roles al usuario (reemplaza los actuales)' })
  assignRoles(@Param('login') login: string, @Body() body: AssignRolesDto) {
    return this.usersService.assignRoles(login, body.groupIds);
  }
}
