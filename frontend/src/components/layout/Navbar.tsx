'use client';

import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Bell } from 'lucide-react';

// Mapa de rutas → títulos legibles
const ROUTE_TITLES: Record<string, string> = {
  '/dashboard':                       'Inicio',
  '/dashboard/ventas':                'Ventas',
  '/dashboard/cierres':               'Cierres',
  '/dashboard/reservas':              'Reservas',
  '/dashboard/seguridad/usuarios':    'Usuarios',
  '/dashboard/seguridad/roles':       'Roles',
  '/dashboard/seguridad/aplicaciones':'Aplicaciones',
  '/dashboard/seguridad/auditoria':   'Auditoría',
};

export default function Navbar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const title = ROUTE_TITLES[pathname] ?? 'Web Reportería';

  return (
    <header style={{
      height: 60,
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      position: 'sticky', top: 0, zIndex: 40,
    }}>
      {/* Título de la sección actual */}
      <div>
        <h1 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {title}
        </h1>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Acciones del lado derecho */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '0.4rem', cursor: 'pointer',
          color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
          transition: 'color 0.2s',
        }}>
          <Bell size={16} />
        </button>

        {/* Chip del usuario */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 8, padding: '0.35rem 0.75rem',
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.65rem', fontWeight: 700, color: 'white',
          }}>
            {user?.username?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {user?.username ?? '—'}
          </span>
          {user?.isAdmin && (
            <span className="badge badge-accent" style={{ fontSize: '0.6rem' }}>Admin</span>
          )}
        </div>
      </div>
    </header>
  );
}
