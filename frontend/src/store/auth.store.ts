'use client';

import { create } from 'zustand';
import { AuthUser } from '@/types/auth.types';

// ── Helpers de cookie (legibles por el middleware del servidor) ──────────────
function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}
function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

interface AuthState {
  user:    AuthUser | null;
  token:   string | null;
  isReady: boolean; // true cuando el store ya leyó localStorage

  setSession: (token: string, user: AuthUser) => void;
  clearSession: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:    null,
  token:   null,
  isReady: false,

  // Llamado al hacer login exitoso
  setSession: (token, user) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setCookie('access_token', token);
    set({ token, user, isReady: true });
  },

  // Llamado al hacer logout o cuando el token expira
  clearSession: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    deleteCookie('access_token');
    set({ token: null, user: null, isReady: true });
  },

  // Llamado al iniciar la app para recuperar la sesión de localStorage
  hydrate: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('access_token');
    let user: AuthUser | null = null;
    try {
      const raw = localStorage.getItem('user');
      user = raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('access_token');
    }
    set({ token: user ? token : null, user, isReady: true });
  },
}));
