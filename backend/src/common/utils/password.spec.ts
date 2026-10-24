import { createHash } from 'crypto';
import { hashPassword, verifyPassword } from './password';

const sha256 = (texto: string) => createHash('sha256').update(texto).digest('hex');

describe('password', () => {
  it('genera hashes bcrypt distintos para la misma contraseña', async () => {
    const [a, b] = await Promise.all([hashPassword('Clave-1'), hashPassword('Clave-1')]);

    expect(a).toMatch(/^\$2b\$12\$/);
    expect(a).not.toBe(b);
  });

  it('valida un hash bcrypt sin pedir migración', async () => {
    const hash = await hashPassword('Clave-1');

    await expect(verifyPassword('Clave-1', hash)).resolves.toEqual({ valid: true, needsRehash: false });
    await expect(verifyPassword('Clave-2', hash)).resolves.toEqual({ valid: false, needsRehash: false });
  });

  it('acepta el SHA-256 heredado y pide migrarlo', async () => {
    await expect(verifyPassword('admin123', sha256('admin123'))).resolves.toEqual({ valid: true, needsRehash: true });
  });

  it('rechaza un SHA-256 heredado que no coincide', async () => {
    await expect(verifyPassword('otra', sha256('admin123'))).resolves.toEqual({ valid: false, needsRehash: false });
  });

  it('rechaza un hash con formato desconocido sin lanzar error', async () => {
    await expect(verifyPassword('admin123', 'texto-plano')).resolves.toEqual({ valid: false, needsRehash: false });
  });
});
