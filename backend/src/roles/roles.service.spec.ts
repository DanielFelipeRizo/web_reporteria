import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { PrismaService } from '../prisma/prisma.service';
import { Actor, buildPermissionsMap } from '../common/permissions/permissions';

// Roles: 1 Administrator, 2 Consulta (ventas y cierres), 5 Ventas (solo acceso), 6 recién creado (vacío)
const GROUP_APPS = [
  { group_id: 2, app_name: 'ventas',  priv_access: 'Y', priv_export: 'Y' },
  { group_id: 2, app_name: 'cierres', priv_access: 'Y' },
  { group_id: 5, app_name: 'ventas',  priv_access: 'Y' },
];

const GESTOR: Actor = {
  login: 'gestor',
  isAdmin: false,
  permissions: buildPermissionsMap([
    { app_name: 'ventas', priv_access: 'Y' },
    { app_name: 'seguridad.roles', priv_access: 'Y', priv_insert: 'Y', priv_update: 'Y', priv_delete: 'Y' },
  ]),
};
const ADMIN: Actor = { login: 'admin', isAdmin: true, permissions: {} };

describe('RolesService', () => {
  let service: RolesService;
  const prisma = {
    sec_groups: {
      findUnique: jest.fn(({ where }) => ([1, 2, 5, 6].includes(where.group_id) ? { group_id: where.group_id } : null)),
      update: jest.fn(),
      delete: jest.fn(),
    },
    sec_groups_apps: {
      findMany: jest.fn(({ where }) => GROUP_APPS.filter((row) => row.group_id === where.group_id)),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    sec_users_groups: { deleteMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  describe('updatePermissions', () => {
    it('un gestor no puede otorgar permisos que no tiene', async () => {
      await expect(service.updatePermissions(5, [{ app_name: 'cierres', priv_access: 'Y' }], GESTOR))
        .rejects.toThrow('No puedes otorgar permisos que no tienes: cierres (acceso)');
      expect(prisma.sec_groups_apps.upsert).not.toHaveBeenCalled();
    });

    it('un gestor otorga permisos que sí tiene', async () => {
      await service.updatePermissions(6, [{ app_name: 'ventas', priv_access: 'Y', priv_export: 'N' }], GESTOR);

      expect(prisma.sec_groups_apps.upsert).toHaveBeenCalledTimes(1);
    });

    it('un gestor quita permisos de un rol que está a su alcance', async () => {
      await service.updatePermissions(5, [{ app_name: 'ventas', priv_access: 'N' }], GESTOR);

      expect(prisma.sec_groups_apps.upsert).toHaveBeenCalledTimes(1);
    });

    it('un administrador otorga cualquier permiso', async () => {
      await service.updatePermissions(5, [{ app_name: 'cierres', priv_access: 'Y' }], ADMIN);

      expect(prisma.sec_groups_apps.upsert).toHaveBeenCalledTimes(1);
    });
  });

  it('un gestor no puede modificar el rol Administrator', async () => {
    await expect(service.updatePermissions(1, [], GESTOR)).rejects.toThrow('Solo un administrador');
    await expect(service.remove(1, GESTOR)).rejects.toThrow(ForbiddenException);
  });

  it('un gestor no puede renombrar ni eliminar un rol con más permisos que él', async () => {
    await expect(service.update(2, 'Otro nombre', GESTOR)).rejects.toThrow('tiene permisos que tú no tienes');
    await expect(service.remove(2, GESTOR)).rejects.toThrow(ForbiddenException);
    expect(prisma.sec_groups.delete).not.toHaveBeenCalled();
  });
});
