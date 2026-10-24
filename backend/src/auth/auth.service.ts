import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { verifyPassword } from '../common/utils/password';

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

    // La contraseña se valida antes que el estado, para no revelar
    // qué usuarios existen a quien no conoce su clave
    const { valid, needsRehash } = await verifyPassword(pass, user.pswd);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.usr_active !== 'Y') {
      throw new UnauthorizedException('Usuario inactivo. Contacte al administrador.');
    }

    // Hash heredado (SHA-256 sin sal): se reemplaza por bcrypt ahora que
    // tenemos la contraseña en texto plano
    if (needsRehash) {
      await this.usersService.upgradePasswordHash(user.login, pass);
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

    const { valid } = await verifyPassword(currentPass, user.pswd);
    if (!valid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    await this.usersService.changePassword(login, newPass);
    return { message: 'Contraseña actualizada correctamente' };
  }
}
