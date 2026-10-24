import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(login: string, pass: string) {
    const user = await this.usersService.findByLogin(login);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.usr_active !== 'Y') {
      throw new UnauthorizedException('Usuario inactivo. Contacte al administrador.');
    }

    // Aplicar SHA-256 al password ingresado
    const hash = crypto.createHash('sha256').update(pass).digest('hex');

    if (user.pswd !== hash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Payload completo con permisos estructurados para el frontend
    const payload = {
      sub: user.login,
      username: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      permissions: user.permissions,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        login: user.login,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        permissions: user.permissions,
      },
    };
  }

  async changePassword(login: string, currentPass: string, newPass: string) {
    const user = await this.usersService.findByLogin(login);
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    const currentHash = crypto.createHash('sha256').update(currentPass).digest('hex');
    if (user.pswd !== currentHash) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    await this.usersService.changePassword(login, newPass);
    return { message: 'Contraseña actualizada correctamente' };
  }
}
