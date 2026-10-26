'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Plus, Pencil, Trash2, Search, X, ShieldCheck,
  Loader2, ChevronLeft, ChevronRight, Settings,
} from 'lucide-react';
import { rolesService, Role } from '@/services/roles.service';

const PAGE_SIZE = 10;

// Rol "Administrator": el backend no permite eliminarlo
const ADMIN_GROUP_ID = 1;

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles]     = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editRole, setEditRole]     = useState<Role | null>(null);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await rolesService.findAll();
      setRoles(data);
    } catch {
      toast.error('Error al cargar los roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  const filtered   = roles.filter((r) => !search || r.description?.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async () => {
    if (!deleteRole) return;
    try {
      await rolesService.remove(deleteRole.group_id);
      toast.success(`Rol "${deleteRole.description}" eliminado`);
      setDeleteRole(null);
      loadRoles();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Error al eliminar el rol'); }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Gestión de Roles</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{roles.length} roles registrados</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> Nuevo Rol</button>
      </div>

      {/* Búsqueda */}
      <div style={{ position: 'relative', maxWidth: 340, marginBottom: '1rem' }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input className="input" style={{ paddingLeft: '2.2rem', paddingRight: search ? '2.2rem' : '1rem' }}
          placeholder="Buscar rol…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        {search && (
          <button onClick={() => { setSearch(''); setPage(1); }} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 0.5rem', display: 'block' }} />
            Cargando roles…
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                  {['Acciones', 'ID', 'Descripción', 'Permisos'].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron roles</td></tr>
                ) : paged.map((r, i) => (
                  <tr key={r.group_id}
                    style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)')}
                  >
                    {/* Acciones */}
                    <td style={{ padding: '0.65rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <ActionBtn icon={<Pencil size={13} />} color="var(--accent-light)" title="Editar nombre" onClick={() => setEditRole(r)} />
                        {r.group_id !== ADMIN_GROUP_ID && (
                          <ActionBtn icon={<Trash2 size={13} />} color="var(--danger)" title="Eliminar" onClick={() => setDeleteRole(r)} />
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{r.group_id}</td>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShieldCheck size={15} style={{ color: 'var(--accent-light)', flexShrink: 0 }} />
                        {r.description}
                      </div>
                    </td>
                    {/* Botón ir a permisos */}
                    <td style={{ padding: '0.65rem 1rem' }}>
                      <button
                        onClick={() => router.push(`/dashboard/seguridad/roles/${r.group_id}`)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                          borderRadius: 6, padding: '0.3rem 0.7rem', cursor: 'pointer',
                          color: 'var(--accent-light)', fontSize: '0.75rem', fontWeight: 500,
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
                      >
                        <Settings size={12} /> Gestionar permisos
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>{Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}</span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem' }} disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={14} /></button>
              <span style={{ color: 'var(--accent-light)' }}>{page} / {totalPages}</span>
              <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem' }} disabled={page === totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      {showCreate && <RoleFormModal onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); loadRoles(); }} />}
      {editRole   && <RoleFormModal role={editRole} onClose={() => setEditRole(null)} onSuccess={() => { setEditRole(null); loadRoles(); }} />}
      {deleteRole && (
        <ConfirmModal
          title="Eliminar rol"
          message={`¿Eliminar el rol "${deleteRole.description}"? Los usuarios asignados a este rol perderán sus permisos.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteRole(null)}
        />
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Modal crear/editar rol ───────────────────────────────────────────────────
function RoleFormModal({ role, onClose, onSuccess }: { role?: Role; onClose: () => void; onSuccess: () => void }) {
  const [description, setDescription] = useState(role?.description ?? '');
  const [saving, setSaving] = useState(false);
  const isEdit = !!role;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) { toast.error('La descripción es requerida'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await rolesService.update(role!.group_id, description);
        toast.success('Rol actualizado');
      } else {
        await rolesService.create(description);
        toast.success('Rol creado');
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al guardar el rol');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{isEdit ? 'Editar Rol' : 'Nuevo Rol'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label">Descripción *</label>
            <input className="input" placeholder="Nombre del rol" value={description} onChange={(e) => setDescription(e.target.value)} autoFocus />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Guardando…</> : (isEdit ? 'Guardar' : 'Crear Rol')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ActionBtn({ icon, color, title, onClick }: { icon: React.ReactNode; color: string; title: string; onClick: () => void }) {
  return (
    <button title={title} onClick={onClick}
      style={{ background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 6, padding: '0.3rem', cursor: 'pointer', color, display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${color}30`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${color}15`; }}
    >{icon}</button>
  );
}

function ConfirmModal({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: '1.5rem' }}>
        <h3 style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: '0.75rem' }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{message}</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn-primary" style={{ background: 'var(--danger)' }} disabled={loading}
            onClick={async () => { setLoading(true); await onConfirm(); }}>
            {loading ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
