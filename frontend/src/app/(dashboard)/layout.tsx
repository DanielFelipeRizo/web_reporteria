'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { hydrate, isReady, token } = useAuthStore();

  // Al montar el layout, recuperar la sesión de localStorage
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Una vez que el store está listo, verificar si hay sesión
  useEffect(() => {
    if (isReady && !token) {
      router.push('/login');
    }
  }, [isReady, token, router]);

  // Mientras hidrata, mostrar pantalla de carga
  if (!isReady) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-base)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '3px solid var(--border-light)',
            borderTopColor: 'var(--accent)',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Cargando...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!token) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar />

      {/* Contenido principal (con margen por el Sidebar fijo) */}
      <div style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar />
        <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
