'use client';

import { useAuthStore } from '@/store/auth.store';
import { canAccess } from '@/lib/permissions';
import { ShoppingCart, FileText, BookMarked, Shield, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface StatCard {
  label:   string;
  icon:    React.ReactNode;
  href:    string;
  module:  string;
  color:   string;
  desc:    string;
}

const CARDS: StatCard[] = [
  { label: 'Ventas',    icon: <ShoppingCart size={22} />, href: '/dashboard/ventas',   module: 'ventas',   color: '#6366f1', desc: 'Consulta y filtra transacciones' },
  { label: 'Cierres',   icon: <FileText size={22} />,     href: '/dashboard/cierres',  module: 'cierres',  color: '#8b5cf6', desc: 'Consulta cierres de lote' },
  { label: 'Reservas',  icon: <BookMarked size={22} />,   href: '/dashboard/reservas', module: 'reservas', color: '#06b6d4', desc: 'Consulta reservas' },
  { label: 'Seguridad', icon: <Shield size={22} />,       href: '/dashboard/seguridad/usuarios', module: 'seguridad.usuarios', color: '#f59e0b', desc: 'Administración y permisos' },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const permissions = user?.permissions;

  const visibleCards = CARDS.filter((c) => canAccess(permissions, c.module));

  return (
    <div>
      {/* Saludo */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Hola, {user?.username} 👋
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
          Bienvenido a Web Reportería. ¿Qué deseas consultar hoy?
        </p>
      </div>

      {/* Tarjetas de acceso rápido */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '1rem',
      }}>
        {visibleCards.map((card) => (
          <Link key={card.module} href={card.href} style={{ textDecoration: 'none' }}>
            <div
              className="card"
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLDivElement).style.borderColor = card.color;
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${card.color}22`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${card.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: card.color, marginBottom: '1rem',
              }}>
                {card.icon}
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                {card.label}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {card.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Banner informativo */}
      <div style={{
        marginTop: '2rem',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 12, padding: '1.25rem 1.5rem',
        display: 'flex', alignItems: 'center', gap: '1rem',
      }}>
        <TrendingUp size={24} color="var(--accent-light)" />
        <div>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
            Plataforma en migración activa
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
            Esta plataforma está siendo migrada desde Scriptcase. Los módulos se irán habilitando progresivamente.
          </p>
        </div>
      </div>
    </div>
  );
}
