import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

/** Solo administradores. Usa el actor que carga PermissionsGuard (datos de la BD, no del token) */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.actor;

    if (!user?.isAdmin) {
      throw new ForbiddenException('Se requieren permisos de administrador');
    }

    return true;
  }
}
