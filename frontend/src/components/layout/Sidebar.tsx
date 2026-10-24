'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ShoppingCart, FileText, BookMarked,
  Users, Shield, AppWindow, ClipboardList, LogOut,
  ChevronDown, ChevronRight, Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { canAccess } from '@/lib/permissions';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';

interface NavItem {
  label:      string;
  href?:      string;
  icon:       React.ReactNode;
  module?:    string;           // clave de permiso
  children?:  NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href:  '/dashboard',
    icon:  <LayoutDashboard size={18} />,
  },
  {
    label:  'Ventas',
    href:   '/dashboard/ventas',
    icon:   <ShoppingCart size={18} />,
    module: 'ventas',
  },
  {
    label:  'Cierres',
    href:   '/dashboard/cierres',
    icon:   <FileText size={18} />,
    module: 'cierres',
  },
  {
    label:  'Reservas',
    href:   '/dashboard/reservas',
    icon:   <BookMarked size={18} />,
    module: 'reservas',
  },
  {
    label: 'Seguridad',
    icon:  <Shield size={18} />,
    children: [
      { label: 'Usuarios',  href: '/dashboard/seguridad/usuarios',  icon: <Users size={16} />,       module: 'seguridad.usuarios' },
      { label: 'Roles',     href: '/dashboard/seguridad/roles',     icon: <Shield size={16} />,      module: 'seguridad.roles' },
      { label: 'Auditoría', href: '/dashboard/seguridad/auditoria', icon: <ClipboardList size={16} />, module: 'seguridad.auditoria' },
    ],
  },
];

export default function Sidebar() {
  const pathname              = usePathname();
  const router                = useRouter();
  const { user, clearSession } = useAuthStore();
  const permissions           = user?.permissions;

  const [secOpen, setSecOpen] = useState(
    pathname.startsWith('/dashboard/seguridad')
  );
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authService.logout();
    } catch { /* ignorar errores de red al cerrar sesión */ }
    clearSession();
    toast.success('Sesión cerrada correctamente');
    router.push('/login');
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0, left: 0,
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{
        padding: '1.25rem 1.2rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Zap size={20} color="white" />
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
            Web
          </p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Reportería</p>
        </div>
      </div>

      {/* Navegación */}
      <nav style={{ flex: 1, padding: '0.75rem 0.6rem', overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => {
          // Los administradores ven TODO el menú sin restricciones
          const isAdmin = user?.isAdmin ?? false;

          // Si tiene módulo y no es admin y no tiene permiso → ocultar
          if (item.module && !isAdmin && !canAccess(permissions, item.module)) return null;

          // Item con hijos (Seguridad)
          if (item.children) {
            const visibleChildren = isAdmin
              ? item.children  // admin ve todos los hijos
              : item.children.filter((c) => !c.module || canAccess(permissions, c.module));

            if (visibleChildren.length === 0) return null;

            return (
              <div key={item.label}>
                <button
                  onClick={() => setSecOpen(!secOpen)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: '0.6rem', padding: '0.55rem 0.8rem', borderRadius: 8,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-secondary)', fontSize: '0.83rem', fontWeight: 500,
                    justifyContent: 'space-between',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{item.icon}</span>
                    {item.label}
                  </span>
                  {secOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {secOpen && (
                  <div style={{ marginLeft: '0.8rem', marginTop: '0.15rem' }}>
                    {visibleChildren.map((child) => (
                      <SidebarLink key={child.href} item={child} active={isActive(child.href!)} />
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // Item simple
          return <SidebarLink key={item.href} item={item} active={isActive(item.href!)} />;
        })}
      </nav>

      {/* Perfil + Logout */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '0.85rem 0.9rem',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {user?.username?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.username ?? '—'}
            </p>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {user?.isAdmin ? 'Administrador' : 'Usuario'}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="btn-secondary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', fontSize: '0.8rem' }}
        >
          <LogOut size={14} />
          {loggingOut ? 'Cerrando...' : 'Cerrar sesión'}
        </button>
      </div>
    </aside>
  );
}

// ── Componente de enlace individual ────────────────────────────────────────
function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href!}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        padding: '0.55rem 0.8rem', borderRadius: 8,
        fontSize: '0.83rem', fontWeight: active ? 600 : 400,
        color: active ? 'var(--accent-light)' : 'var(--text-secondary)',
        background: active ? 'rgba(99,102,241,0.1)' : 'transparent',
        textDecoration: 'none',
        transition: 'all 0.15s',
        borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
      }}
    >
      <span style={{ color: active ? 'var(--accent-light)' : 'var(--text-muted)', flexShrink: 0 }}>
        {item.icon}
      </span>
      {item.label}
    </Link>
  );
}
