import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword } from '../common/utils/password';

// Módulos del sistema - definen qué permisos tiene sentido para cada sección
const SYSTEM_MODULES = [
  { name: 'ventas',                  privs: ['access','export','print'] },
  { name: 'cierres',                 privs: ['access','export','print'] },
  { name: 'reservas',                privs: ['access','export'] },
  { name: 'seguridad.usuarios',      privs: ['access','insert','update','delete'] },
  { name: 'seguridad.roles',         privs: ['access','insert','update','delete'] },
  { name: 'seguridad.aplicaciones',  privs: ['access'] },
  { name: 'seguridad.auditoria',     privs: ['access','export'] },
];

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /** Construye el mapa de permisos estructurado para el JWT */
  private buildPermissionsMap(groupApps: any[]): Record<string, Record<string, boolean>> {
    const permissions: Record<string, Record<string, boolean>> = {};

    for (const mod of SYSTEM_MODULES) {
      const appPerms = groupApps.find(ga => ga.app_name === mod.name);
      const permObj: Record<string, boolean> = {};

      for (const priv of mod.privs) {
        // mapeo: access→priv_access, insert→priv_insert, etc.
        const field = `priv_${priv}` as keyof typeof appPerms;
        permObj[priv] = appPerms ? (appPerms[field] === 'Y') : false;
      }
      permissions[mod.name] = permObj;
    }
    return permissions;
  }

  /** Busca usuario por login y devuelve perfil completo con permisos estructurados */
  async findByLogin(login: string) {
    const user = await this.prisma.sec_users.findUnique({ where: { login } });
    if (!user) return null;

    const userGroups = await this.prisma.sec_users_groups.findMany({ where: { login } });
    const groupIds = userGroups.map(ug => ug.group_id);

    const groupApps = await this.prisma.sec_groups_apps.findMany({
      where: { group_id: { in: groupIds } },
    });

    // Admin = pertenece al grupo "Administrator" (group_id = 1)
    const isAdmin = groupIds.includes(1);
    const permissions = this.buildPermissionsMap(groupApps);

    return { ...user, groupIds, isAdmin, permissions };
  }

  /** Lista todos los usuarios con sus grupos asignados */
  async findAll() {
    const users = await this.prisma.sec_users.findMany({
      select: {
        login: true, name: true, email: true,
        usr_active: true, priv_admin: true,
        FechaAlta: true, FechaHoraUltAct: true,
      },
      orderBy: { login: 'asc' },
    });

    // Enriquecer con grupos en dos consultas planas (sin relación Prisma)
    const logins = users.map(u => u.login);
    const allUserGroups = await this.prisma.sec_users_groups.findMany({
      where: { login: { in: logins } },
    });
    const groupIds = [...new Set(allUserGroups.map(g => g.group_id))];
    const allGroupDefs = await this.prisma.sec_groups.findMany({
      where: { group_id: { in: groupIds } },
      select: { group_id: true, description: true },
    });

    return users.map(user => {
      const userGroups = allUserGroups.filter(g => g.login === user.login);
      const userGroupIds = userGroups.map(g => g.group_id);
      const roles = userGroupIds.map(id => ({
        group_id:    id,
        description: allGroupDefs.find(d => d.group_id === id)?.description ?? '',
      }));
      return { ...user, groupIds: userGroupIds, roles };
    });
  }

  /** Crea un nuevo usuario con password hasheado en bcrypt */
  async create(data: { login: string; pswd: string; name?: string; email?: string; priv_admin?: string }) {
    const exists = await this.prisma.sec_users.findUnique({ where: { login: data.login } });
    if (exists) throw new ConflictException(`El usuario '${data.login}' ya existe`);

    const hashedPswd = await hashPassword(data.pswd);

    return this.prisma.sec_users.create({
      data: {
        login: data.login,
        pswd: hashedPswd,
        name: data.name,
        email: data.email,
        usr_active: 'Y',
        priv_admin: data.priv_admin ?? 'N',
        FechaAlta: new Date(),
        UsuarioAlta: 'system',
      },
    });
  }

  /** Edita datos del usuario (sin cambiar password) */
  async update(login: string, data: { name?: string; email?: string; usr_active?: string }) {
    const user = await this.prisma.sec_users.findUnique({ where: { login } });
    if (!user) throw new NotFoundException(`Usuario '${login}' no encontrado`);

    return this.prisma.sec_users.update({
      where: { login },
      data: { ...data, FechaHoraUltAct: new Date() },
    });
  }

  /** Elimina un usuario */
  async remove(login: string) {
    const user = await this.prisma.sec_users.findUnique({ where: { login } });
    if (!user) throw new NotFoundException(`Usuario '${login}' no encontrado`);

    // Eliminar relaciones primero
    await this.prisma.sec_users_groups.deleteMany({ where: { login } });
    await this.prisma.sec_users_historico_claves.deleteMany({ where: { usu_login: login } });
    return this.prisma.sec_users.delete({ where: { login } });
  }

  /** Cambia el password de un usuario (guarda historial) */
  async changePassword(login: string, newPassword: string) {
    const user = await this.prisma.sec_users.findUnique({ where: { login } });
    if (!user) throw new NotFoundException(`Usuario '${login}' no encontrado`);

    // Guardar el hash anterior en el historial
    await this.prisma.sec_users_historico_claves.create({
      data: {
        fecha: new Date(),
        usu_login: login,
        usu_hash_antiguo: user.pswd,
      },
    });

    const newHash = await hashPassword(newPassword);
    return this.prisma.sec_users.update({
      where: { login },
      data: {
        pswd: newHash,
        usr_fecha_creacion_clave: new Date(),
        FechaHoraUltAct: new Date(),
      },
    });
  }

  /**
   * Reemplaza un hash heredado por bcrypt tras un login exitoso.
   * Es la misma contraseña, así que no se registra en el historial ni cambia fechas.
   */
  async upgradePasswordHash(login: string, plainPassword: string) {
    await this.prisma.sec_users.update({
      where: { login },
      data: { pswd: await hashPassword(plainPassword) },
    });
  }

  /** Asigna/reemplaza los roles de un usuario */
  async assignRoles(login: string, groupIds: number[]) {
    const user = await this.prisma.sec_users.findUnique({ where: { login } });
    if (!user) throw new NotFoundException(`Usuario '${login}' no encontrado`);

    await this.prisma.sec_users_groups.deleteMany({ where: { login } });

    if (groupIds.length > 0) {
      await this.prisma.sec_users_groups.createMany({
        data: groupIds.map(id => ({ login, group_id: id })),
      });
    }
    return { login, groupIds };
  }
}
