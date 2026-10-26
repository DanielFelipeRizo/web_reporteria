import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ExpiredPasswordDto } from './dto/expired-password.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso. Retorna access_token y perfil con permisos.' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas o usuario inactivo' })
  @ApiResponse({ status: 403, description: 'Contraseña vencida: code = PASSWORD_CHANGE_REQUIRED' })
  signIn(@Body() dto: LoginDto) {
    return this.authService.signIn(dto.login, dto.pswd);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('change-expired-password')
  @ApiOperation({ summary: 'Cambiar una contraseña vencida e iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Contraseña cambiada. Retorna access_token y perfil, igual que el login.' })
  @ApiResponse({ status: 400, description: 'La contraseña no está vencida, o la nueva es igual a la actual' })
  changeExpiredPassword(@Body() dto: ExpiredPasswordDto) {
    return this.authService.changeExpiredPassword(dto.login, dto.pswd, dto.newPassword);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener mi perfil y permisos' })
  @ApiResponse({ status: 200, description: 'Retorna el perfil del usuario autenticado desde el JWT' })
  getProfile(@Request() req: any) {
    return req.user;
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión (registra auditoría)' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada. El Audit Interceptor registra el evento.' })
  logout(@Request() req: any) {
    return { message: `Sesión cerrada para ${req.user.sub}` };
  }

  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar contraseña del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada y guardada en historial' })
  @ApiResponse({ status: 400, description: 'Contraseña actual incorrecta, o la nueva es igual a la actual' })
  changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.sub, dto.currentPassword, dto.newPassword);
  }
}
