// Módulos del sistema - definen qué permisos tiene sentido para cada sección
export const SYSTEM_MODULES = [
  { name: 'ventas',                  privs: ['access','export','print'] },
  { name: 'cierres',                 privs: ['access','export','print'] },
  { name: 'reservas',                privs: ['access','export'] },
  { name: 'seguridad.usuarios',      privs: ['access','insert','update','delete'] },
  { name: 'seguridad.roles',         privs: ['access','insert','update','delete'] },
  { name: 'seguridad.aplicaciones',  privs: ['access'] },
  { name: 'seguridad.auditoria',     privs: ['access','export'] },
];

/** Grupo "Administrator": sus miembros tienen todos los permisos */
export const ADMIN_GROUP_ID = 1;

export type PermissionsMap = Record<string, Record<string, boolean>>;

/** Usuario que hace la petición, con permisos leídos de la BD (lo carga PermissionsGuard) */
export interface Actor {
  login: string;
  isAdmin: boolean;
  permissions: PermissionsMap;
}

/** Fila de sec_groups_apps: app_name + priv_access, priv_insert, etc. con 'Y' / 'N' */
export type GroupAppRow = { app_name: string; [priv: `priv_${string}`]: string | null | undefined };

/**
 * Construye el mapa de permisos { módulo: { acción: boolean } }.
 * Con varios roles hay una fila por rol y módulo: basta con que uno lo otorgue.
 */
export function buildPermissionsMap(groupApps: GroupAppRow[]): PermissionsMap {
  const permissions: PermissionsMap = {};

  for (const mod of SYSTEM_MODULES) {
    const rows = groupApps.filter(ga => ga.app_name === mod.name);
    const permObj: Record<string, boolean> = {};

    for (const priv of mod.privs) {
      // mapeo: access→priv_access, insert→priv_insert, etc.
      permObj[priv] = rows.some(row => row[`priv_${priv}`] === 'Y');
    }
    permissions[mod.name] = permObj;
  }
  return permissions;
}

const ACTION_LABELS: Record<string, string> = {
  access: 'acceso', insert: 'crear', update: 'editar', delete: 'eliminar', export: 'exportar', print: 'imprimir',
};

/** Privilegios que `granted` otorga y `holder` no tiene, como "módulo (acción)" */
export function missingPrivileges(granted: PermissionsMap, holder: PermissionsMap): string[] {
  return Object.entries(granted).flatMap(([module, actions]) =>
    Object.entries(actions)
      .filter(([action, value]) => value && !holder[module]?.[action])
      .map(([action]) => `${module} (${ACTION_LABELS[action] ?? action})`),
  );
}
