import {
  BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable, UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { verifyPassword } from '../common/utils/password';

type AuthUser = NonNullable<Awaited<ReturnType<UsersService['findByLogin']>>>;

/** Código que el frontend usa para pedir la contraseña nueva en el login */
export const PASSWORD_CHANGE_REQUIRED = 'PASSWORD_CHANGE_REQUIRED';

// Bloqueo temporal tras varios intentos fallidos de login seguidos
const MAX_FAILED_LOGINS = 5;
const LOGIN_LOCK_MINUTES = 15;

/** La clave vence cuando otro usuario la asignó (creación o reseteo) o si llegó su fecha */
const isPasswordExpired = (user: AuthUser) =>
  user.usr_fecha_exp_clave !== null && user.usr_fecha_exp_clave <= new Date();

/** "15 minutos" / "1 minuto" hasta `until` (redondeado hacia arriba) */
const minutesUntil = (until: Date) => {
  const minutes = Math.max(1, Math.ceil((until.getTime() - Date.now()) / 60_000));
  return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
};

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /** Valida login, contraseña y estado; no revisa si la clave está vencida */
  private async authenticate(login: string, pass: string): Promise<AuthUser> {
    const user = await this.usersService.findByLogin(login);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Cuenta bloqueada por intentos fallidos: ni se revisa la contraseña,
    // así no se puede seguir probando claves durante el bloqueo
    const locked = (until: Date) => new HttpException(
      `Cuenta bloqueada por intentos fallidos. Intenta de nuevo en ${minutesUntil(until)}`,
      HttpStatus.TOO_MANY_REQUESTS,
    );
    if (user.usr_bloqueado_hasta && user.usr_bloqueado_hasta > new Date()) {
      throw locked(user.usr_bloqueado_hasta);
    }

    // El intento se cuenta antes de revisar la clave: con intentos en paralelo,
    // solo los primeros MAX_FAILED_LOGINS llegan a probar una contraseña
    const attempt = await this.usersService.startLoginAttempt(user.login);
    if (attempt === null || attempt > MAX_FAILED_LOGINS) {
      throw locked(await this.usersService.lockAccount(user.login, LOGIN_LOCK_MINUTES));
    }

    // La contraseña se valida antes que el estado, para no revelar
    // qué usuarios existen a quien no conoce su clave
    const { valid, needsRehash } = await verifyPassword(pass, user.pswd);
    if (!valid) {
      if (attempt < MAX_FAILED_LOGINS) throw new UnauthorizedException('Credenciales inválidas');

      const lockedUntil = await this.usersService.lockAccount(user.login, LOGIN_LOCK_MINUTES);
      throw new UnauthorizedException(
        `Credenciales inválidas. La cuenta quedó bloqueada ${minutesUntil(lockedUntil)} por intentos fallidos`,
      );
    }

    await this.usersService.clearFailedLogins(user.login);

    if (user.usr_active !== 'Y') {
      throw new UnauthorizedException('Usuario inactivo. Contacte al administrador.');
    }

    // Hash heredado (SHA-256 sin sal): se reemplaza por bcrypt ahora que
    // tenemos la contraseña en texto plano
    if (needsRehash) {
      await this.usersService.upgradePasswordHash(user.login, pass);
    }

    return user;
  }

  /** La nueva contraseña no puede ser la misma que la actual */
  private async assertNewPasswordDiffers(newPass: string, currentHash: string) {
    if ((await verifyPassword(newPass, currentHash)).valid) {
      throw new BadRequestException('La nueva contraseña debe ser distinta de la actual');
    }
  }

  private async issueToken(user: AuthUser) {
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

  async signIn(login: string, pass: string) {
    const user = await this.authenticate(login, pass);

    if (isPasswordExpired(user)) {
      throw new ForbiddenException({
        statusCode: 403,
        code: PASSWORD_CHANGE_REQUIRED,
        message: 'Debes cambiar tu contraseña antes de continuar',
      });
    }

    return this.issueToken(user);
  }

  /** Cambio obligatorio desde el login, cuando la clave está vencida */
  async changeExpiredPassword(login: string, pass: string, newPass: string) {
    const user = await this.authenticate(login, pass);

    if (!isPasswordExpired(user)) {
      throw new BadRequestException('Tu contraseña no está vencida; inicia sesión normalmente');
    }
    await this.assertNewPasswordDiffers(newPass, user.pswd);

    await this.usersService.changePassword(login, newPass, { expire: false });
    return this.issueToken(user);
  }

  async changePassword(login: string, currentPass: string, newPass: string) {
    const user = await this.usersService.findByLogin(login);
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    // 400 y no 401: el frontend interpreta un 401 como sesión vencida y cierra la sesión
    const { valid } = await verifyPassword(currentPass, user.pswd);
    if (!valid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }
    await this.assertNewPasswordDiffers(newPass, user.pswd);

    await this.usersService.changePassword(login, newPass, { expire: false });
    return { message: 'Contraseña actualizada correctamente' };
  }
}
