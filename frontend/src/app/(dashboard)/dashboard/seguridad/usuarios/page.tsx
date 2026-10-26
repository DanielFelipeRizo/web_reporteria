'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  UserPlus, Pencil, Trash2, Search, X, Eye, EyeOff,
  Loader2, CheckCircle, XCircle, ChevronLeft, ChevronRight, Lock,
} from 'lucide-react';
import { usersService } from '@/services/users.service';
import { rolesService, Role } from '@/services/roles.service';
import { User } from '@/types/users.types';
import { useAuthStore } from '@/store/auth.store';
import { validatePassword } from '@/lib/password';

const PAGE_SIZE = 10;

export default function UsuariosPage() {
  const currentLogin          = useAuthStore((s) => s.user?.sub);
  const [users, setUsers]     = useState<User[]>([]);
  const [roles, setRoles]     = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser]     = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([usersService.findAll(), rolesService.findAll()]);
      // Ordenar por login (el backend ya lo ordena, pero por si acaso)
      setUsers([...u].sort((a, b) => a.login.localeCompare(b.login)));
      setRoles(r);
    } catch {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = users.filter((u) =>
    !search || [u.login, u.name, u.email].some((v) =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const confirmDelete = async () => {
    if (!deleteUser) return;
    try {
      await usersService.remove(deleteUser.login);
      toast.success(`Usuario ${deleteUser.login} eliminado`);
      setDeleteUser(null);
      loadData();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Error al eliminar el usuario'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Gestión de Usuarios</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{users.length} usuarios registrados</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}><UserPlus size={16} /> Nuevo Usuario</button>
      </div>

      {/* Búsqueda con botón X */}
      <div style={{ position: 'relative', maxWidth: 340, marginBottom: '1rem' }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="input" style={{ paddingLeft: '2.2rem', paddingRight: search ? '2.2rem' : '1rem' }}
          placeholder="Buscar por usuario, nombre o correo…"
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        {search && (
          <button onClick={() => { setSearch(''); setPage(1); }} style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center',
          }}><X size={14} /></button>
        )}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 0.5rem', display: 'block' }} />
            Cargando usuarios…
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                  {['Acciones', 'Usuario', 'Nombre', 'Correo', 'Activo', 'Tipo usuario'].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron usuarios</td></tr>
                ) : paged.map((u, i) => (
                  <tr key={u.login}
                    style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)')}
                  >
                    <td style={{ padding: '0.65rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <ActionBtn icon={<Pencil size={13} />} color="var(--accent-light)" title="Editar" onClick={() => setEditUser(u)} />
                        {/* Nadie puede eliminar su propio usuario (el backend también lo impide) */}
                        {u.login !== currentLogin && (
                          <ActionBtn icon={<Trash2 size={13} />} color="var(--danger)" title="Eliminar" onClick={() => setDeleteUser(u)} />
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--accent-light)', fontWeight: 500 }}>{u.login}</td>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-primary)' }}>{u.name ?? '—'}</td>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)' }}>{u.email ?? '—'}</td>
                    <td style={{ padding: '0.65rem 1rem' }}>
                      {u.usr_active === 'Y'
                        ? <span className="badge badge-success"><CheckCircle size={10} /> Activo</span>
                        : <span className="badge badge-danger"><XCircle size={10} /> Inactivo</span>}
                      {/* Se desbloquea solo al vencer, o asignándole una contraseña nueva */}
                      {u.usr_bloqueado_hasta && new Date(u.usr_bloqueado_hasta) > new Date() && (
                        <span className="badge badge-warning" style={{ marginLeft: '0.3rem' }}
                          title="Bloqueado por intentos fallidos. Asignarle una contraseña nueva lo desbloquea.">
                          <Lock size={10} /> Bloqueado hasta {new Date(u.usr_bloqueado_hasta).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.65rem 1rem' }}>
                      {/* Muestra todos los roles del usuario */}
                      {u.roles && u.roles.length > 0 ? (
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {u.roles.map((r: any) => (
                            <span key={r.group_id} className={r.group_id === 1 ? 'badge badge-accent' : 'badge badge-warning'}>
                              {r.description}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Sin rol</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Mostrando {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}</span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem' }} disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={14} /></button>
              <span style={{ color: 'var(--accent-light)' }}>{page} / {totalPages}</span>
              <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem' }} disabled={page === totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {showCreate && <CreateUserModal roles={roles} onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); loadData(); }} />}
      {editUser   && <EditUserModal user={editUser} roles={roles} onClose={() => setEditUser(null)} onSuccess={() => { setEditUser(null); loadData(); }} />}
      {deleteUser && <ConfirmModal title="Eliminar usuario" message={`¿Eliminar el usuario "${deleteUser.login}"? Esta acción no se puede deshacer.`} onConfirm={confirmDelete} onCancel={() => setDeleteUser(null)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card" style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p style={{ fontSize: '0.72rem', color: 'var(--danger)', marginTop: '0.25rem' }}>{error}</p>}
    </div>
  );
}

function PasswordInput({ value, show, onToggle, onChange, placeholder }: { value: string; show: boolean; onToggle: () => void; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ position: 'relative' }}>
      <input className="input" type={show ? 'text' : 'password'} placeholder={placeholder}
        style={{ paddingRight: '2.5rem' }} value={value} onChange={(e) => onChange(e.target.value)} />
      <button type="button" onClick={onToggle} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

function CreateUserModal({ roles, onClose, onSuccess }: { roles: Role[]; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm]     = useState({ login: '', pswd: '', confirm: '', name: '', email: '', groupId: '' });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.login.trim())   e.login   = 'Requerido';
    if (!form.name.trim())    e.name    = 'Requerido';
    if (!form.email.trim())   e.email   = 'Requerido';
    if (!form.groupId)        e.groupId = 'Selecciona un tipo de usuario';
    const pwErr = validatePassword(form.pswd);
    if (pwErr) e.pswd = pwErr;
    if (form.pswd !== form.confirm) e.confirm = 'Las contraseñas no coinciden';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await usersService.create({ login: form.login, pswd: form.pswd, name: form.name, email: form.email });
      await usersService.assignRoles(form.login, [parseInt(form.groupId)]);
      toast.success(`Usuario "${form.login}" creado. Deberá cambiar la contraseña al iniciar sesión`);
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al crear el usuario');
    } finally { setSaving(false); }
  };

  return (
    <Modal title="Nuevo Usuario" onClose={onClose}>
      <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
        <p style={{ fontWeight: 600, color: 'var(--accent-light)', marginBottom: '0.4rem' }}>RESTRICCIONES DE CONTRASEÑA</p>
        <ul style={{ listStyle: 'none', lineHeight: 1.9 }}>
          <li>• Mínimo 8 caracteres</li><li>• Al menos un número y una letra</li>
          <li>• Al menos un carácter especial ($@!%*,&lt;&gt;+&amp;%)</li><li>• Al menos una letra en mayúscula</li>
        </ul>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <FormField label="Usuario *" error={errors.login}>
          <input className="input" placeholder="nombre de usuario" value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} />
        </FormField>
        <FormField label="Nueva Contraseña *" error={errors.pswd}>
          <PasswordInput value={form.pswd} show={showPw} onToggle={() => setShowPw(!showPw)} onChange={(v) => setForm({ ...form, pswd: v })} placeholder="Contraseña" />
        </FormField>
        <FormField label="Confirmar contraseña *" error={errors.confirm}>
          <input className="input" type="password" placeholder="Repite la contraseña" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
        </FormField>
        <FormField label="Nombre completo *" error={errors.name}>
          <input className="input" placeholder="Nombre completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </FormField>
        <FormField label="E-mail *" error={errors.email}>
          <input className="input" type="email" placeholder="correo@empresa.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </FormField>
        <FormField label="Tipo de usuario *" error={errors.groupId}>
          <select className="input" value={form.groupId} onChange={(e) => setForm({ ...form, groupId: e.target.value })}>
            <option value="">Seleccione una opción</option>
            {roles.map((r) => <option key={r.group_id} value={r.group_id}>{r.description}</option>)}
          </select>
        </FormField>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>* Campos obligatorios</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Guardando…</> : 'Crear Usuario'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditUserModal({ user, roles, onClose, onSuccess }: { user: User; roles: Role[]; onClose: () => void; onSuccess: () => void }) {
  // Nadie puede desactivarse ni cambiar sus propios roles (el backend también lo impide)
  const isSelf = useAuthStore((s) => s.user?.sub) === user.login;
  const currentGroupId = user.groupIds?.[0];
  const [form, setForm] = useState({
    name:        user.name ?? '',
    email:       user.email ?? '',
    active:      user.usr_active ?? 'Y',
    changePass:  'N',
    newPass:     '',
    confirmPass: '',
    updateRole:  'N',
    newGroupId:  currentGroupId?.toString() ?? '',
  });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentRole = (user.roles as any[])?.find((r: any) => r.group_id === currentGroupId);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email.trim()) e.email = 'Requerido';
    if (form.changePass === 'Y') {
      const pwErr = validatePassword(form.newPass);
      if (pwErr) e.newPass = pwErr;
      if (form.newPass !== form.confirmPass) e.confirmPass = 'Las contraseñas no coinciden';
    }
    if (form.updateRole === 'Y' && !form.newGroupId) e.newGroupId = 'Selecciona un rol';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      // 1) Actualizar datos básicos
      await usersService.update(user.login, { name: form.name, email: form.email, usr_active: form.active });

      // 2) Cambiar contraseña si se indicó
      if (form.changePass === 'Y' && form.newPass) {
        await usersService.changePassword(user.login, form.newPass);
      }

      // 3) Actualizar rol si se indicó
      if (form.updateRole === 'Y' && form.newGroupId) {
        await usersService.assignRoles(user.login, [parseInt(form.newGroupId)]);
      }

      toast.success(form.changePass === 'Y'
        ? `Usuario "${user.login}" actualizado. Deberá cambiar la contraseña al iniciar sesión`
        : `Usuario "${user.login}" actualizado`);
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al actualizar el usuario');
    } finally { setSaving(false); }
  };

  return (
    <Modal title="Editar Usuario" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Login: solo lectura con estilo diferenciado */}
        <div>
          <label className="label">Login (no editable)</label>
          <div style={{
            padding: '0.6rem 1rem', borderRadius: 8, fontSize: '0.875rem',
            background: 'var(--bg-base)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', fontFamily: 'monospace',
          }}>{user.login}</div>
        </div>

        <FormField label="Nombre completo" error={errors.name}>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </FormField>

        <FormField label="E-mail *" error={errors.email}>
          <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </FormField>

        {/* La propia contraseña se cambia desde la barra superior (pide la actual) */}
        {!isSelf && (
          <FormField label="Cambiar contraseña">
            <select className="input" value={form.changePass} onChange={(e) => setForm({ ...form, changePass: e.target.value })}>
              <option value="N">No</option><option value="Y">Sí</option>
            </select>
          </FormField>
        )}

        {!isSelf && form.changePass === 'Y' && <>
          <FormField label="Nueva contraseña *" error={errors.newPass}>
            <PasswordInput value={form.newPass} show={showPw} onToggle={() => setShowPw(!showPw)} onChange={(v) => setForm({ ...form, newPass: v })} placeholder="Nueva contraseña" />
          </FormField>
          <FormField label="Confirmar contraseña *" error={errors.confirmPass}>
            <input className="input" type="password" value={form.confirmPass} onChange={(e) => setForm({ ...form, confirmPass: e.target.value })} />
          </FormField>
        </>}

        <FormField label="Activar usuario">
          <select className="input" value={form.active} disabled={isSelf} onChange={(e) => setForm({ ...form, active: e.target.value })}>
            <option value="Y">Sí</option><option value="N">No</option>
          </select>
        </FormField>

        <div>
          <label className="label">Rol actual</label>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', padding: '0.4rem 0' }}>
            {currentRole?.description ?? 'Sin rol asignado'}
          </p>
        </div>

        {isSelf ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            No puedes desactivarte ni cambiar tus propios roles: pídeselo a otro usuario con permiso.
            Tu contraseña la cambias con el botón de la llave en la barra superior.
          </p>
        ) : (
          <FormField label="Actualizar tipo de usuario">
            <select className="input" value={form.updateRole} onChange={(e) => setForm({ ...form, updateRole: e.target.value })}>
              <option value="N">No</option><option value="Y">Sí</option>
            </select>
          </FormField>
        )}

        {!isSelf && form.updateRole === 'Y' && (
          <FormField label="Nuevo tipo de usuario *" error={errors.newGroupId}>
            <select className="input" value={form.newGroupId} onChange={(e) => setForm({ ...form, newGroupId: e.target.value })}>
              <option value="">Seleccione una opción</option>
              {roles.map((r) => <option key={r.group_id} value={r.group_id}>{r.description}</option>)}
            </select>
          </FormField>
        )}

        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>* Campos obligatorios</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Guardando…</> : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
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
