import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Actor, ADMIN_GROUP_ID, buildPermissionsMap, missingPrivileges,
} from '../common/permissions/permissions';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  /** Un no-administrador solo modifica roles que no tengan más permisos que él */
  private async assertCanManageRole(actor: Actor, id: number) {
    if (actor.isAdmin) return;

    if (id === ADMIN_GROUP_ID) {
      throw new ForbiddenException('Solo un administrador puede modificar el rol Administrator');
    }

    // Podría quitarse a sí mismo el permiso de gestionar roles
    if (actor.groupIds.includes(id)) {
      throw new ForbiddenException('No puedes modificar un rol que tienes asignado');
    }

    const groupApps = await this.prisma.sec_groups_apps.findMany({ where: { group_id: id } });
    const missing = missingPrivileges(buildPermissionsMap(groupApps), actor.permissions);
    if (missing.length > 0) {
      throw new ForbiddenException(`No puedes modificar este rol porque tiene permisos que tú no tienes: ${missing.join(', ')}`);
    }
  }

  findAll() {
    return this.prisma.sec_groups.findMany({ orderBy: { group_id: 'asc' } });
  }

  async findOne(id: number) {
    const role = await this.prisma.sec_groups.findUnique({ where: { group_id: id } });
    if (!role) throw new NotFoundException(`Rol con id ${id} no encontrado`);
    return role;
  }

  create(description: string) {
    return this.prisma.sec_groups.create({ data: { description } });
  }

  async update(id: number, description: string, actor: Actor) {
    await this.findOne(id);
    await this.assertCanManageRole(actor, id);
    return this.prisma.sec_groups.update({ where: { group_id: id }, data: { description } });
  }

  async remove(id: number, actor: Actor) {
    // Sin este rol nadie sería administrador (isAdmin depende de pertenecer a él)
    if (id === ADMIN_GROUP_ID) throw new ForbiddenException('El rol Administrator no se puede eliminar');

    await this.findOne(id);
    await this.assertCanManageRole(actor, id);
    await this.prisma.sec_groups_apps.deleteMany({ where: { group_id: id } });
    await this.prisma.sec_users_groups.deleteMany({ where: { group_id: id } });
    return this.prisma.sec_groups.delete({ where: { group_id: id } });
  }

  async getPermissions(id: number) {
    await this.findOne(id);
    return this.prisma.sec_groups_apps.findMany({ where: { group_id: id } });
  }

  async updatePermissions(
    id: number,
    permissions: {
      app_name: string;
      priv_access?: string;
      priv_insert?: string;
      priv_delete?: string;
      priv_update?: string;
      priv_export?: string;
      priv_print?: string;
    }[],
    actor: Actor,
  ) {
    await this.findOne(id);
    await this.assertCanManageRole(actor, id);

    if (!actor.isAdmin) {
      // Resultado final del upsert: las filas actuales con los valores enviados encima
      const current = await this.prisma.sec_groups_apps.findMany({ where: { group_id: id } });
      const finalRows = [
        ...current.map((row) => ({ ...row, ...permissions.find((p) => p.app_name === row.app_name) })),
        ...permissions.filter((p) => !current.some((row) => row.app_name === p.app_name)),
      ];
      const missing = missingPrivileges(buildPermissionsMap(finalRows), actor.permissions);
      if (missing.length > 0) {
        throw new ForbiddenException(`No puedes otorgar permisos que no tienes: ${missing.join(', ')}`);
      }
    }

    // Usar upsert por cada permiso
    for (const perm of permissions) {
      await this.prisma.sec_groups_apps.upsert({
        where: { app_name_group_id: { app_name: perm.app_name, group_id: id } },
        create: { group_id: id, ...perm },
        update: { ...perm },
      });
    }
    return this.getPermissions(id);
  }
}
