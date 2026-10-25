import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';

/**
 * Exige al menos uno de los permisos indicados como "módulo:acción",
 * p. ej. @RequirePermission('seguridad.roles:update'). Los administradores siempre pasan.
 * Se usa junto con PermissionsGuard.
 */
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
