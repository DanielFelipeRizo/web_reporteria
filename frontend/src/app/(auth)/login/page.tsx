'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Lock, User, Eye, EyeOff, Loader2, Zap } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { validatePassword } from '@/lib/password';
import { LoginResponse } from '@/types/auth.types';

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [login, setLogin] = useState('');
  const [pswd, setPswd] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Contraseña vencida (la asignó otro usuario): se pide una nueva antes de entrar
  const [mustChange, setMustChange]   = useState(false);
  const [newPass, setNewPass]         = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const startSession = (res: LoginResponse) => {
    setSession(res.access_token, res.user);
    toast.success(`Bienvenido, ${res.user.username}`);
    router.push('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !pswd.trim()) {
      toast.error('Completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      startSession(await authService.login(login.trim(), pswd));
    } catch (err: any) {
      if (err?.response?.data?.code === 'PASSWORD_CHANGE_REQUIRED') {
        setMustChange(true);
        toast.info(err.response.data.message);
        return;
      }
      const msg = err?.response?.data?.message ?? 'Error al iniciar sesión';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeExpired = async (e: React.FormEvent) => {
    e.preventDefault();
    const pwErr = validatePassword(newPass);
    if (pwErr) { toast.error(pwErr); return; }
    if (newPass !== confirmPass) { toast.error('Las contraseñas no coinciden'); return; }

    setLoading(true);
    try {
      startSession(await authService.changeExpiredPassword(login.trim(), pswd, newPass));
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = () => {
    setMustChange(false);
    setNewPass('');
    setConfirmPass('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Orbes decorativos de fondo */}
      <div style={{
        position: 'absolute', top: '20%', left: '15%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '15%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Tarjeta de login */}
      <div className="glass" style={{
        width: '100%', maxWidth: 420,
        borderRadius: 20, padding: '2.5rem 2rem',
        position: 'relative', zIndex: 1,
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
            marginBottom: '1rem',
            boxShadow: '0 8px 24px var(--accent-glow)',
          }}>
            <Zap size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Web Reportería
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.3rem' }}>
            Plataforma de reportería transaccional
          </p>
        </div>

        {mustChange ? (
          <form onSubmit={handleChangeExpired} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Tu contraseña fue asignada por otro usuario. Elige una nueva para <strong>{login.trim()}</strong>.
            </p>
            <div>
              <label className="label" htmlFor="newPass">Nueva contraseña</label>
              <input id="newPass" type={showPass ? 'text' : 'password'} className="input" autoFocus
                autoComplete="new-password" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="confirmPass">Confirmar contraseña</label>
              <input id="confirmPass" type={showPass ? 'text' : 'password'} className="input"
                autoComplete="new-password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              Mínimo 8 caracteres, con una mayúscula, un número y un carácter especial.
            </p>
            <button type="submit" className="btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '0.8rem' }}>
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Cambiar contraseña y entrar'}
            </button>
            <button type="button" className="btn-secondary" onClick={backToLogin}
              style={{ width: '100%', justifyContent: 'center' }}>
              Volver
            </button>
          </form>
        ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Usuario */}
          <div>
            <label className="label" htmlFor="login">Usuario</label>
            <div style={{ position: 'relative' }}>
              <User
                size={16}
                style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                id="login"
                type="text"
                className="input"
                style={{ paddingLeft: '2.2rem' }}
                placeholder="Tu nombre de usuario"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label className="label" htmlFor="pswd">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                id="pswd"
                type={showPass ? 'text' : 'password'}
                className="input"
                style={{ paddingLeft: '2.2rem', paddingRight: '2.5rem' }}
                placeholder="Tu contraseña"
                value={pswd}
                onChange={(e) => setPswd(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Botón */}
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.8rem' }}
          >
            {loading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>
        )}

        {/* Footer */}
        <p style={{
          textAlign: 'center', marginTop: '1.5rem',
          color: 'var(--text-muted)', fontSize: '0.75rem',
        }}>
          © {new Date().getFullYear()} Web Reportería · Todos los derechos reservados
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
