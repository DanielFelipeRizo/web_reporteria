import * as bcrypt from 'bcryptjs';
import { createHash, timingSafeEqual } from 'crypto';

const BCRYPT_COST = 12;

/** Genera el hash bcrypt de una contraseña */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

/**
 * Compara una contraseña con el hash guardado en sec_users.pswd.
 * Acepta bcrypt y el formato heredado de la BD original (SHA-256 hex sin sal).
 * needsRehash = true indica que el hash es heredado y conviene reemplazarlo.
 */
export async function verifyPassword(plain: string, stored: string) {
  if (stored.startsWith('$2')) {
    return { valid: await bcrypt.compare(plain, stored), needsRehash: false };
  }

  const legacy = Buffer.from(createHash('sha256').update(plain).digest('hex'));
  const saved  = Buffer.from(stored);
  const valid  = legacy.length === saved.length && timingSafeEqual(legacy, saved);
  return { valid, needsRehash: valid };
}
