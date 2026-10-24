'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, CheckSquare, Square } from 'lucide-react';
import { rolesService, ModulePermission } from '@/services/roles.service';

// ── Definición de módulos y sus privilegios disponibles ─────────────────────
const MODULES = [
  {
    section: 'Transaccional',
    items: [
      { name: 'ventas',   label: 'Ventas',   privs: ['access', 'export', 'print'] },
      { name: 'cierres',  label: 'Cierres',  privs: ['access', 'export', 'print'] },
      { name: 'reservas', label: 'Reservas', privs: ['access', 'export'] },
    ],
  },
  {
    section: 'Seguridad',
    items: [
      { name: 'seguridad.usuarios',     label: 'Usuarios',     privs: ['access', 'insert', 'update', 'delete'] },
      { name: 'seguridad.roles',        label: 'Roles',        privs: ['access', 'insert', 'update', 'delete'] },
      { name: 'seguridad.aplicaciones', label: 'Aplicaciones', privs: ['access'] },
      { name: 'seguridad.auditoria',    label: 'Auditoría',    privs: ['access', 'export'] },
    ],
  },
];

const ALL_PRIVS = ['access', 'insert', 'update', 'delete', 'export', 'print'];
const PRIV_LABELS: Record<string, string> = {
  access: 'Acceder',
  insert: 'Insertar',
  update: 'Actualizar',
  delete: 'Eliminar',
  export: 'Exportar',
  print:  'Imprimir',
};

type PermMap = Record<string, Record<string, boolean>>;

function buildPermMap(permissions: ModulePermission[]): PermMap {
  const map: PermMap = {};
  for (const p of permissions) {
    map[p.app_name] = {
      access: p.priv_access === 'Y',
      insert: p.priv_insert === 'Y',
      update: p.priv_update === 'Y',
      delete: p.priv_delete === 'Y',
      export: p.priv_export === 'Y',
      print:  p.priv_print  === 'Y',
    };
  }
  // Asegurar que todos los módulos estén en el mapa
  for (const section of MODULES) {
    for (const item of section.items) {
      if (!map[item.name]) {
        map[item.name] = { access: false, insert: false, update: false, delete: false, export: false, print: false };
      }
    }
  }
  return map;
}

function permMapToDto(map: PermMap): ModulePermission[] {
  return Object.entries(map).map(([app_name, privs]) => ({
    app_name,
    priv_access: privs.access ? 'Y' : 'N',
    priv_insert: privs.insert ? 'Y' : 'N',
    priv_update: privs.update ? 'Y' : 'N',
    priv_delete: privs.delete ? 'Y' : 'N',
    priv_export: privs.export ? 'Y' : 'N',
    priv_print:  privs.print  ? 'Y' : 'N',
  }));
}

export default function RolePermissionsPage() {
  const params   = useParams();
  const router   = useRouter();
  const roleId   = Number(params.id);

  const [roleName, setRoleName] = useState('');
  const [permMap, setPermMap]   = useState<PermMap>({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [roles, perms] = await Promise.all([
        rolesService.findAll(),
        rolesService.getPermissions(roleId),
      ]);
      const role = roles.find((r) => r.group_id === roleId);
      setRoleName(role?.description ?? `Rol ${roleId}`);
      setPermMap(buildPermMap(perms));
    } catch {
      toast.error('Error al cargar permisos');
    } finally {
      setLoading(false);
    }
  }, [roleId]);

  useEffect(() => { load(); }, [load]);

  const toggle = (module: string, priv: string) => {
    setPermMap((prev) => ({
      ...prev,
      [module]: { ...prev[module], [priv]: !prev[module]?.[priv] },
    }));
  };

  // Marcar/desmarcar toda una fila
  const toggleRow = (module: string, availablePrivs: string[]) => {
    const allOn = availablePrivs.every((p) => permMap[module]?.[p]);
    setPermMap((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        ...Object.fromEntries(availablePrivs.map((p) => [p, !allOn])),
      },
    }));
  };

  // Marcar/desmarcar toda una columna dentro de una sección
  const toggleColumn = (priv: string, items: { name: string; privs: string[] }[]) => {
    const applicable = items.filter((i) => i.privs.includes(priv));
    const allOn = applicable.every((i) => permMap[i.name]?.[priv]);
    setPermMap((prev) => {
      const next = { ...prev };
      for (const item of applicable) {
        next[item.name] = { ...next[item.name], [priv]: !allOn };
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await rolesService.updatePermissions(roleId, permMapToDto(permMap));
      toast.success('Permisos guardados correctamente');
    } catch {
      toast.error('Error al guardar permisos');
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '1rem', color: 'var(--text-muted)' }}>
        <Loader2 size={28} style={{ animation: 'spin 0.8s linear infinite' }} />
        <p>Cargando permisos…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => router.back()} className="btn-secondary" style={{ padding: '0.4rem', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Permisos del rol
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--accent-light)', marginTop: 2 }}>{roleName}</p>
          </div>
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Guardando…</> : <><Save size={14} /> Guardar cambios</>}
        </button>
      </div>

      {/* Tabla de permisos por sección */}
      {MODULES.map((section) => (
        <div key={section.section} className="card" style={{ marginBottom: '1.25rem', overflow: 'hidden' }}>
          {/* Cabecera de sección */}
          <div style={{
            padding: '0.75rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-light)' }}>
              {section.section}
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {/* Col fila-checkbox */}
                  <th style={{ width: 40, padding: '0.6rem 0.75rem' }} />
                  {/* Módulo */}
                  <th style={{ padding: '0.6rem 1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 160 }}>
                    Módulo
                  </th>
                  {/* Columnas de privilegios */}
                  {ALL_PRIVS.map((priv) => (
                    <th key={priv} style={{ padding: '0.6rem 0.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 90 }}>
                      <button
                        onClick={() => toggleColumn(priv, section.items)}
                        title={`Marcar/desmarcar ${PRIV_LABELS[priv]} en toda la sección`}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', width: '100%' }}
                      >
                        {PRIV_LABELS[priv]}
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>▲ todo</span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.items.map((item, i) => {
                  const allOn = item.privs.every((p) => permMap[item.name]?.[p]);
                  return (
                    <tr key={item.name}
                      style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.05)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)')}
                    >
                      {/* Checkbox de fila completa */}
                      <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                        <button onClick={() => toggleRow(item.name, item.privs)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: allOn ? 'var(--accent-light)' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                          {allOn ? <CheckSquare size={16} /> : <Square size={16} />}
                        </button>
                      </td>
                      {/* Nombre del módulo */}
                      <td style={{ padding: '0.6rem 1rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {item.label}
                        <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{item.name}</span>
                      </td>
                      {/* Checkboxes por privilegio */}
                      {ALL_PRIVS.map((priv) => {
                        const available = item.privs.includes(priv);
                        const checked   = permMap[item.name]?.[priv] ?? false;
                        return (
                          <td key={priv} style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                            {available ? (
                              <button onClick={() => toggle(item.name, priv)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', color: checked ? 'var(--success)' : 'var(--text-muted)', transition: 'color 0.15s' }}>
                                {checked ? <CheckSquare size={17} /> : <Square size={17} />}
                              </button>
                            ) : (
                              <span style={{ color: 'var(--border-light)', fontSize: '0.75rem' }}>—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Botón guardar flotante al fondo */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '0.7rem 1.5rem' }}>
          {saving ? <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Guardando…</> : <><Save size={14} /> Guardar cambios</>}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
