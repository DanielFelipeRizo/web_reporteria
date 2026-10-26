import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Actor } from '../common/permissions/permissions';

// Roles: 1 Administrator, 2 Consulta (ventas y cierres completos), 4 Gestor, 5 Ventas (solo acceso)
const GROUP_APPS = [
  { group_id: 2, app_name: 'ventas',  priv_access: 'Y', priv_export: 'Y', priv_print: 'Y' },
  { group_id: 2, app_name: 'cierres', priv_access: 'Y', priv_export: 'Y', priv_print: 'Y' },
  { group_id: 4, app_name: 'ventas',  priv_access: 'Y' },
  { group_id: 4, app_name: 'seguridad.usuarios', priv_access: 'Y', priv_insert: 'Y', priv_update: 'Y', priv_delete: 'Y' },
  { group_id: 5, app_name: 'ventas',  priv_access: 'Y' },
  { group_id: 6, app_name: 'seguridad.usuarios', priv_access: 'Y', priv_insert: 'Y' },
];
const USER_GROUPS: Record<string, number[]> = {
  admin: [1], consulta: [2], gestor: [4], vendedor: [5], nuevo: [], creador: [5, 6],
};

describe('UsersService', () => {
  let service: UsersService;
  const prisma = {
    sec_users: {
      findUnique: jest.fn(({ where }) => (where.login in USER_GROUPS ? { login: where.login, pswd: 'x', usr_active: 'Y' } : null)),
      update: jest.fn(),
      delete: jest.fn(),
    },
    sec_users_groups: {
      findMany: jest.fn(({ where }) => USER_GROUPS[where.login].map((group_id) => ({ login: where.login, group_id }))),
      count: jest.fn(({ where }) => USER_GROUPS[where.login].length),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    sec_groups_apps: {
      findMany: jest.fn(({ where }) => GROUP_APPS.filter((row) => where.group_id.in.includes(row.group_id))),
    },
    sec_users_historico_claves: { create: jest.fn(), deleteMany: jest.fn() },
  };
  const actor = async (login: string) => (await service.findByLogin(login)) as Actor;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('remove', () => {
    it('nadie puede eliminarse a sí mismo, tampoco un administrador', async () => {
      await expect(service.remove('admin', await actor('admin'))).rejects.toThrow('No puedes eliminar tu propio usuario');
      expect(prisma.sec_users.delete).not.toHaveBeenCalled();
    });

    it('un gestor elimina a un usuario con menos permisos', async () => {
      await service.remove('vendedor', await actor('gestor'));

      expect(prisma.sec_users.delete).toHaveBeenCalledWith({ where: { login: 'vendedor' } });
    });

    it.each(['admin', 'consulta'])('un gestor no puede eliminar a %s, que tiene más permisos', async (login) => {
      await expect(service.remove(login, await actor('gestor'))).rejects.toThrow(ForbiddenException);
      expect(prisma.sec_users.delete).not.toHaveBeenCalled();
    });
  });

  it('un gestor no puede cambiarle la contraseña a un administrador', async () => {
    await expect(service.resetPassword('admin', 'Clave-Nueva1', await actor('gestor'))).rejects.toThrow(ForbiddenException);
    expect(prisma.sec_users.update).not.toHaveBeenCalled();
  });

  it('un gestor no puede editar a un administrador', async () => {
    await expect(service.update('admin', { usr_active: 'N' }, await actor('gestor'))).rejects.toThrow(ForbiddenException);
  });

  describe('acciones sobre uno mismo', () => {
    it('nadie puede desactivarse, tampoco un administrador', async () => {
      await expect(service.update('admin', { usr_active: 'N' }, await actor('admin')))
        .rejects.toThrow('No puedes desactivar tu propio usuario');
      expect(prisma.sec_users.update).not.toHaveBeenCalled();
    });

    it('sí puede editar sus propios datos (el formulario reenvía usr_active = Y)', async () => {
      await service.update('admin', { name: 'Nuevo nombre', usr_active: 'Y' }, await actor('admin'));

      expect(prisma.sec_users.update).toHaveBeenCalled();
    });

    it('un administrador no puede quitarse el rol Administrator', async () => {
      await expect(service.assignRoles('admin', [2], await actor('admin'))).rejects.toThrow('No puedes cambiar tus propios roles');
      expect(prisma.sec_users_groups.deleteMany).not.toHaveBeenCalled();
    });

    it('reenviar los mismos roles no cuenta como cambio', async () => {
      await expect(service.assignRoles('gestor', [4], await actor('gestor'))).resolves.toBeDefined();
    });

    it('un administrador sí puede desactivar a otro administrador', async () => {
      USER_GROUPS.admin2 = [1];
      await service.update('admin2', { usr_active: 'N' }, await actor('admin'));
      delete USER_GROUPS.admin2;

      expect(prisma.sec_users.update).toHaveBeenCalled();
    });
  });

  describe('assignRoles', () => {
    it('un gestor no puede asignar un rol con permisos que él no tiene', async () => {
      await expect(service.assignRoles('vendedor', [2], await actor('gestor')))
        .rejects.toThrow('No puedes asignar roles con permisos que no tienes: ventas (exportar), ventas (imprimir), cierres (acceso)');
      expect(prisma.sec_users_groups.createMany).not.toHaveBeenCalled();
    });

    it('un gestor no puede asignar el rol Administrator', async () => {
      await expect(service.assignRoles('nuevo', [1], await actor('gestor'))).rejects.toThrow('Solo un administrador');
    });

    it('un gestor asigna un rol cuyos permisos sí tiene', async () => {
      await service.assignRoles('nuevo', [5], await actor('gestor'));

      expect(prisma.sec_users_groups.createMany).toHaveBeenCalledWith({ data: [{ login: 'nuevo', group_id: 5 }] });
    });

    it('con permiso de crear pero no de editar, solo da roles a usuarios sin roles', async () => {
      const creador = await actor('creador');

      await expect(service.assignRoles('nuevo', [5], creador)).resolves.toBeDefined();
      await expect(service.assignRoles('vendedor', [5], creador)).rejects.toThrow('Necesitas permiso para editar usuarios');
    });

    it('un administrador asigna cualquier rol', async () => {
      await service.assignRoles('vendedor', [2], await actor('admin'));

      expect(prisma.sec_users_groups.createMany).toHaveBeenCalled();
    });
  });
});
