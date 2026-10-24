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
  signIn(@Body() dto: LoginDto) {
    return this.authService.signIn(dto.login, dto.pswd);
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
  @ApiResponse({ status: 401, description: 'Contraseña actual incorrecta' })
  changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.sub, dto.currentPassword, dto.newPassword);
  }
}
