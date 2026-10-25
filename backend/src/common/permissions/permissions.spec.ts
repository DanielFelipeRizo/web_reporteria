import { buildPermissionsMap, missingPrivileges } from './permissions';

describe('buildPermissionsMap', () => {
  it('suma los permisos de todos los roles del usuario', () => {
    // Antes se tomaba solo la primera fila de cada módulo y se perdía el export del segundo rol
    const map = buildPermissionsMap([
      { app_name: 'ventas', priv_access: 'Y', priv_export: 'N' },
      { app_name: 'ventas', priv_access: 'Y', priv_export: 'Y' },
    ]);

    expect(map.ventas).toEqual({ access: true, export: true, print: false });
  });

  it('ignora acciones y módulos que no existen en el sistema', () => {
    const map = buildPermissionsMap([
      { app_name: 'ventas', priv_insert: 'Y' },
      { app_name: 'modulo.viejo', priv_access: 'Y' },
    ]);

    expect(map.ventas).toEqual({ access: false, export: false, print: false });
    expect(map['modulo.viejo']).toBeUndefined();
  });
});

describe('missingPrivileges', () => {
  const gestor = buildPermissionsMap([{ app_name: 'ventas', priv_access: 'Y' }]);

  it('lista los privilegios que el otro no tiene', () => {
    const pedido = buildPermissionsMap([
      { app_name: 'ventas', priv_access: 'Y', priv_export: 'Y' },
      { app_name: 'cierres', priv_access: 'Y' },
    ]);

    expect(missingPrivileges(pedido, gestor)).toEqual(['ventas (exportar)', 'cierres (acceso)']);
  });

  it('no reporta nada si los permisos están incluidos', () => {
    expect(missingPrivileges(gestor, gestor)).toEqual([]);
    expect(missingPrivileges(buildPermissionsMap([]), gestor)).toEqual([]);
  });
});
