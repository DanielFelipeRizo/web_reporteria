import { UserPermissions } from '@/types/auth.types';

/**
 * Verifica si el usuario tiene un permiso específico en un módulo.
 * Uso: can(permissions, 'ventas', 'export')
 */
export function can(
  permissions: UserPermissions | undefined,
  module: string,
  action: string
): boolean {
  if (!permissions) return false;
  const mod = permissions[module] as Record<string, boolean> | undefined;
  return mod?.[action] === true;
}

/**
 * Verifica si el usuario tiene acceso (access) a un módulo.
 * Uso: canAccess(permissions, 'ventas')
 */
export function canAccess(permissions: UserPermissions | undefined, module: string): boolean {
  return can(permissions, module, 'access');
}
