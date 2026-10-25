import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { UsersService } from '../../users/users.service';
import { buildPermissionsMap } from '../permissions/permissions';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('PermissionsGuard', () => {
  const usersService = { findByLogin: jest.fn() };
  const reflector = { getAllAndOverride: jest.fn() };
  const guard = new PermissionsGuard(reflector as unknown as Reflector, usersService as unknown as UsersService);

  const gestor = {
    login: 'gestor', usr_active: 'Y', isAdmin: false,
    permissions: buildPermissionsMap([{ app_name: 'seguridad.usuarios', priv_access: 'Y' }]),
  };

  /** Ejecuta el guard para una ruta que exige `required`; devuelve también el request */
  async function run(required: string[] | undefined, isPublic = false) {
    reflector.getAllAndOverride.mockImplementation((key: string) => (key === IS_PUBLIC_KEY ? isPublic : required));
    const request: Record<string, unknown> = { user: { sub: 'gestor' } };
    const context = {
      getHandler: () => null,
      getClass: () => null,
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    return { result: await guard.canActivate(context), request };
  }

  beforeEach(() => jest.clearAllMocks());

  it('deja pasar si tiene alguno de los permisos pedidos y adjunta el actor', async () => {
    usersService.findByLogin.mockResolvedValue(gestor);

    const { result, request } = await run(['seguridad.roles:access', 'seguridad.usuarios:access']);

    expect(result).toBe(true);
    expect(request.actor).toBe(gestor);
  });

  it('responde 403 si no tiene el permiso', async () => {
    usersService.findByLogin.mockResolvedValue(gestor);

    await expect(run(['seguridad.usuarios:delete'])).rejects.toThrow(ForbiddenException);
  });

  it('deja pasar siempre a los administradores', async () => {
    usersService.findByLogin.mockResolvedValue({ ...gestor, isAdmin: true });

    await expect(run(['seguridad.usuarios:delete'])).resolves.toMatchObject({ result: true });
  });

  it('deja pasar las rutas públicas sin consultar la BD', async () => {
    await expect(run(undefined, true)).resolves.toMatchObject({ result: true });
    expect(usersService.findByLogin).not.toHaveBeenCalled();
  });

  it.each([
    ['eliminado', null],
    ['inactivo', { ...gestor, usr_active: 'N' }],
  ])('rechaza con 401 un token de un usuario %s', async (_caso, usuario) => {
    usersService.findByLogin.mockResolvedValue(usuario);

    await expect(run(undefined)).rejects.toThrow(UnauthorizedException);
  });
});
