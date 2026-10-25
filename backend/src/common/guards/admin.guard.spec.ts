import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

const contexto = (request: object) =>
  ({ switchToHttp: () => ({ getRequest: () => request }) }) as unknown as ExecutionContext;

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('deja pasar a un administrador', () => {
    expect(guard.canActivate(contexto({ actor: { isAdmin: true } }))).toBe(true);
  });

  it('usa los datos de la BD y no los del token', () => {
    // Le quitaron el rol Administrator después de iniciar sesión
    const request = { user: { isAdmin: true }, actor: { isAdmin: false } };

    expect(() => guard.canActivate(contexto(request))).toThrow(ForbiddenException);
  });
});
