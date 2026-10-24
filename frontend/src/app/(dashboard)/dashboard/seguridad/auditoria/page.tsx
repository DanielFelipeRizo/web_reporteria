'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Loader2, Search, Eraser, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { auditService, AuditLog, AuditFilters } from '@/services/audit.service';
import { usersService } from '@/services/users.service';
import { User } from '@/types/users.types';

const PAGE_SIZE = 15;

const ACTIONS = [
  { value: 'access', label: 'Acceso' },
  { value: 'insert', label: 'Insertar' },
  { value: 'update', label: 'Actualizar' },
  { value: 'delete', label: 'Eliminar' },
  { value: 'export', label: 'Exportar' },
];

const MODULES = [
  'ventas', 'cierres', 'reservas',
  'seguridad.usuarios', 'seguridad.roles', 'seguridad.aplicaciones', 'seguridad.auditoria',
];

export default function AuditoriaPage() {
  const [logs, setLogs]             = useState<AuditLog[]>([]);
  const [users, setUsers]           = useState<User[]>([]);
  const [loading, setLoading]       = useState(false);
  const [loadingUsers, setLdUsers]  = useState(true);

  const [meta, setMeta] = useState({ total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 });

  // Filtros de UI
  const [filters, setFilters] = useState<AuditFilters>({
    username: '', application: '', action: '', from: '', to: '',
  });

  // ── Cargar usuarios para el combo ──────────────────────────────────────────
  useEffect(() => {
    usersService.findAll()
      .then(u => setUsers(u))
      .catch(() => toast.error('Error al cargar lista de usuarios'))
      .finally(() => setLdUsers(false));
  }, []);

  // ── Función de búsqueda ────────────────────────────────────────────────────
  const searchLogs = useCallback(async (pageToLoad: number = 1) => {
    setLoading(true);
    try {
      const resp = await auditService.findAll({ ...filters, page: pageToLoad, limit: PAGE_SIZE });
      setLogs(resp.data);
      setMeta(resp.meta);
    } catch {
      toast.error('Error al consultar la auditoría');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Carga inicial sin filtros (opcional, o se puede dejar vacío hasta que busque)
  useEffect(() => { searchLogs(1); }, []); // eslint-disable-line

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchLogs(1);
  };

  const handleClear = () => {
    setFilters({ username: '', application: '', action: '', from: '', to: '' });
    // setTimeout para asegurar que el estado se actualice antes de buscar
    setTimeout(() => searchLogs(1), 0);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).format(d);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Filtros ──────────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '1.5rem', borderTop: '4px solid var(--accent-light)' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            
            {/* Usuario (Login) */}
            <div>
              <label className="label" style={{ marginBottom: '0.4rem' }}>Usuario</label>
              <select className="input" value={filters.username} onChange={e => setFilters({ ...filters, username: e.target.value })}>
                <option value="">Todos</option>
                {loadingUsers ? <option disabled>Cargando...</option> : users.map(u => (
                  <option key={u.login} value={u.login}>{u.login} {u.name ? `(${u.name})` : ''}</option>
                ))}
              </select>
            </div>

            {/* Permisos (Módulo) */}
            <div>
              <label className="label" style={{ marginBottom: '0.4rem' }}>Módulo (Permisos)</label>
              <select className="input" value={filters.application} onChange={e => setFilters({ ...filters, application: e.target.value })}>
                <option value="">Todos</option>
                {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Acción */}
            <div>
              <label className="label" style={{ marginBottom: '0.4rem' }}>Acción</label>
              <select className="input" value={filters.action} onChange={e => setFilters({ ...filters, action: e.target.value })}>
                <option value="">Todas</option>
                {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {/* Fechas */}
            <div>
              <label className="label" style={{ marginBottom: '0.4rem' }}>Fecha Desde</label>
              <input type="date" className="input" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} />
            </div>
            <div>
              <label className="label" style={{ marginBottom: '0.4rem' }}>Fecha Hasta</label>
              <input type="date" className="input" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <button type="submit" className="btn-primary" style={{ minWidth: 120, justifyContent: 'center' }} disabled={loading}>
              {loading ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Search size={16} />}
              Buscar
            </button>
            <button type="button" className="btn-secondary" style={{ minWidth: 120, justifyContent: 'center' }} onClick={handleClear} disabled={loading}>
              <Eraser size={16} /> Limpiar filtros
            </button>
          </div>
        </form>
      </div>

      {/* ── Resultados ───────────────────────────────────────────────────── */}
      <div className="card" style={{ overflow: 'hidden', flex: 1 }}>
        <div style={{
          padding: '1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileText size={16} style={{ color: 'var(--accent-light)' }} />
            Resultados de Auditoría
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {meta.total} registros encontrados
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 0.5rem', display: 'block' }} />
            Buscando registros…
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.1)' }}>
                  {['Fecha', 'Usuario', 'Módulo', 'Acción', 'Descripción'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay datos para mostrar con los filtros actuales</td></tr>
                ) : logs.map((log, i) => (
                  <tr key={log.id}
                    style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)')}
                  >
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatDate(log.inserted_date)}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--accent-light)', fontWeight: 500 }}>{log.username}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)' }}>{log.application}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className={
                        log.action === 'access' ? 'badge badge-success' :
                        log.action === 'delete' ? 'badge badge-danger' :
                        log.action === 'update' ? 'badge badge-warning' : 'badge badge-accent'
                      }>
                        {ACTIONS.find(a => a.value === log.action)?.label ?? log.action}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.description}>
                      {log.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Paginación ─────────────────────────────────────────────────── */}
        {!loading && meta.totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Mostrando página {meta.page} de {meta.totalPages}</span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem' }} disabled={meta.page === 1} onClick={() => searchLogs(meta.page - 1)}><ChevronLeft size={14} /></button>
              <span style={{ color: 'var(--accent-light)' }}>{meta.page}</span>
              <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem' }} disabled={meta.page === meta.totalPages} onClick={() => searchLogs(meta.page + 1)}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
