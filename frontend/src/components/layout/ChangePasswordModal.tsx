'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { validatePassword } from '@/lib/password';

/** Cambio de la propia contraseña (pide la actual) */
export default function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [form, setForm]     = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pwErr = !form.current ? 'Ingresa tu contraseña actual'
      : validatePassword(form.next) ?? (form.next !== form.confirm ? 'Las contraseñas no coinciden' : null);
    setError(pwErr);
    if (pwErr) return;

    setSaving(true);
    try {
      await authService.changePassword(form.current, form.next);
      toast.success('Contraseña actualizada');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al cambiar la contraseña');
    } finally { setSaving(false); }
  };

  const field = (label: string, key: keyof typeof form, autoComplete: string) => (
    <div>
      <label className="label">{label}</label>
      <input className="input" type="password" autoComplete={autoComplete}
        value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>Cambiar contraseña</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {field('Contraseña actual', 'current', 'current-password')}
          {field('Nueva contraseña', 'next', 'new-password')}
          {field('Confirmar nueva contraseña', 'confirm', 'new-password')}
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            Mínimo 8 caracteres, con una mayúscula, un número y un carácter especial.
          </p>
          {error && <p style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
