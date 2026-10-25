import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../users/users.service';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/require-permission.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard global, corre después de JwtAuthGuard. Verifica los permisos de
 * @RequirePermission con datos frescos de la BD: el token puede traer permisos
 * de hasta una hora atrás, o de un usuario que ya fue desactivado o eliminado.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? [];

    const request = context.switchToHttp().getRequest();
    const actor = await this.usersService.findByLogin(request.user?.sub);
    if (!actor || actor.usr_active !== 'Y') {
      throw new UnauthorizedException('Tu usuario ya no está activo');
    }
    // Disponible en los controladores con @CurrentActor()
    request.actor = actor;

    if (actor.isAdmin || required.length === 0) return true;

    const allowed = required.some((permission) => {
      const [module, action] = permission.split(':');
      return actor.permissions[module]?.[action] === true;
    });
    if (!allowed) throw new ForbiddenException('No tienes permiso para realizar esta acción');

    return true;
  }
}
