/**
 * Política de contraseñas nuevas. El backend valida la misma regla
 * (IsValidPassword), así que esto solo adelanta el mensaje al usuario.
 */
export function validatePassword(pw: string): string | null {
  if (pw.length < 8)                return 'Mínimo 8 caracteres';
  if (!/[A-Z]/.test(pw))           return 'Al menos una mayúscula';
  if (!/[0-9]/.test(pw))           return 'Al menos un número';
  if (!/[$@!%*,.<>+&%?]/.test(pw)) return 'Al menos un carácter especial';
  return null;
}
