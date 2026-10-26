import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword } from '../common/utils/password';
import {
  Actor, ADMIN_GROUP_ID, buildPermissionsMap, missingPrivileges,
} from '../common/permissions/permissions';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Cuenta un intento de login ANTES de revisar la contraseña y devuelve su
   * número, o null si la cuenta está bloqueada. El incremento es atómico en
   * SQL: aunque lleguen muchos intentos en paralelo, cada uno recibe un número
   * distinto, así que solo los primeros llegan a probar una clave.
   * Las fechas se guardan en UTC (sin zona), por eso se compara con now() en UTC.
   */
  async startLoginAttempt(login: string): Promise<number | null> {
    const rows = await this.prisma.$queryRaw<{ usr_intentos: number }[]>`
      UPDATE "sec_users" SET "usr_intentos" = COALESCE("usr_intentos", 0) + 1
      WHERE "login" = ${login}
        AND ("usr_bloqueado_hasta" IS NULL OR "usr_bloqueado_hasta" <= (now() AT TIME ZONE 'UTC'))
      RETURNING "usr_intentos"
    `;
    return rows[0]?.usr_intentos ?? null;
  }

  /**
   * Bloquea la cuenta `minutes` minutos y reinicia el contador, para que al
   * terminar el bloqueo vuelva a tener todos los intentos. Devuelve la fecha de fin.
   */
  async lockAccount(login: string, minutes: number): Promise<Date> {
    const lockedUntil = new Date(Date.now() + minutes * 60_000);
    const { count } = await this.prisma.sec_users.updateMany({
      where: { login, OR: [{ usr_bloqueado_hasta: null }, { usr_bloqueado_hasta: { lte: new Date() } }] },
      data: { usr_intentos: 0, usr_bloqueado_hasta: lockedUntil },
    });
    if (count > 0) return lockedUntil;

    // Otro intento en paralelo ya la bloqueó: se respeta ese bloqueo
    const user = await this.prisma.sec_users.findUnique({ where: { login }, select: { usr_bloqueado_hasta: true } });
    return user?.usr_bloqueado_hasta ?? lockedUntil;
  }

  /** Login correcto: reinicia el contador de intentos fallidos y quita el bloqueo */
  async clearFailedLogins(login: string) {
    await this.prisma.sec_users.update({
      where: { login },
      data: { usr_intentos: 0, usr_bloqueado_hasta: null },
    });
  }

  /**
   * Un no-administrador solo gestiona usuarios que no tengan más permisos que él;
   * si no, podría por ejemplo cambiarle la contraseña a un administrador y entrar como él.
   */
  private async assertCanManage(actor: Actor, login: string) {
    if (actor.isAdmin) return;

    const target = await this.findByLogin(login);
    if (!target) throw new NotFoundException(`Usuario '${login}' no encontrado`);

    if (target.isAdmin || missingPrivileges(target.permissions, actor.permissions).length > 0) {
      throw new ForbiddenException(`No puedes gestionar a '${login}' porque tiene permisos que tú no tienes`);
    }
  }

  /** Un no-administrador solo asigna roles cuyos permisos él también tiene */
  private async assertCanAssignRoles(actor: Actor, login: string, groupIds: number[]) {
    if (actor.isAdmin) return;

    await this.assertCanManage(actor, login);

    // Con permiso de crear (sin editar) solo puede dar roles al usuario recién creado
    const currentRoles = await this.prisma.sec_users_groups.count({ where: { login } });
    if (currentRoles > 0 && !actor.permissions['seguridad.usuarios']?.update) {
      throw new ForbiddenException('Necesitas permiso para editar usuarios para cambiar sus roles');
    }

    if (groupIds.includes(ADMIN_GROUP_ID)) {
      throw new ForbiddenException('Solo un administrador puede asignar el rol Administrator');
    }

    const groupApps = await this.prisma.sec_groups_apps.findMany({ where: { group_id: { in: groupIds } } });
    const missing = missingPrivileges(buildPermissionsMap(groupApps), actor.permissions);
    if (missing.length > 0) {
      throw new ForbiddenException(`No puedes asignar roles con permisos que no tienes: ${missing.join(', ')}`);
    }
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
    const isAdmin = groupIds.includes(ADMIN_GROUP_ID);
    const permissions = buildPermissionsMap(groupApps);

    return { ...user, groupIds, isAdmin, permissions };
  }

  /** Lista todos los usuarios con sus grupos asignados */
  async findAll() {
    const users = await this.prisma.sec_users.findMany({
      select: {
        login: true, name: true, email: true,
        usr_active: true, priv_admin: true, usr_bloqueado_hasta: true,
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
    const now = new Date();

    return this.prisma.sec_users.create({
      data: {
        login: data.login,
        pswd: hashedPswd,
        name: data.name,
        email: data.email,
        usr_active: 'Y',
        priv_admin: data.priv_admin ?? 'N',
        FechaAlta: now,
        UsuarioAlta: 'system',
        usr_fecha_creacion_clave: now,
        // La clave inicial la eligió otro usuario: se debe cambiar en el primer login
        usr_fecha_exp_clave: now,
      },
    });
  }

  /** Edita datos del usuario (sin cambiar password) */
  async update(login: string, data: { name?: string; email?: string; usr_active?: string }, actor: Actor) {
    if (login === actor.login && data.usr_active === 'N') {
      throw new ForbiddenException('No puedes desactivar tu propio usuario');
    }

    const user = await this.prisma.sec_users.findUnique({ where: { login } });
    if (!user) throw new NotFoundException(`Usuario '${login}' no encontrado`);
    await this.assertCanManage(actor, login);

    return this.prisma.sec_users.update({
      where: { login },
      data: { ...data, FechaHoraUltAct: new Date() },
    });
  }

  /** Elimina un usuario */
  async remove(login: string, actor: Actor) {
    if (login === actor.login) throw new ForbiddenException('No puedes eliminar tu propio usuario');

    const user = await this.prisma.sec_users.findUnique({ where: { login } });
    if (!user) throw new NotFoundException(`Usuario '${login}' no encontrado`);
    await this.assertCanManage(actor, login);

    // Eliminar relaciones primero
    await this.prisma.sec_users_groups.deleteMany({ where: { login } });
    await this.prisma.sec_users_historico_claves.deleteMany({ where: { usu_login: login } });
    return this.prisma.sec_users.delete({ where: { login } });
  }

  /**
   * Un gestor de usuarios le asigna una contraseña nueva a otro usuario,
   * que deberá cambiarla en su siguiente login.
   */
  async resetPassword(login: string, newPassword: string, actor: Actor) {
    // Por esta vía no se pide la contraseña actual
    if (login === actor.login) {
      throw new ForbiddenException('Para cambiar tu propia contraseña usa la opción "Cambiar contraseña"');
    }
    await this.assertCanManage(actor, login);
    return this.changePassword(login, newPassword, { expire: true });
  }

  /**
   * Cambia el password de un usuario (guarda historial).
   * expire = true deja la clave vencida para obligar a cambiarla en el siguiente login.
   */
  async changePassword(login: string, newPassword: string, { expire }: { expire: boolean }) {
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
        usr_fecha_exp_clave: expire ? new Date() : null,
        // Con contraseña nueva se levanta el bloqueo: así un gestor desbloquea una cuenta
        usr_intentos: 0,
        usr_bloqueado_hasta: null,
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
  async assignRoles(login: string, groupIds: number[], actor: Actor) {
    // Quitarse un rol propio puede dejarlo sin acceso (o al sistema sin administradores)
    if (login === actor.login) {
      const requested = new Set(groupIds);
      const unchanged = requested.size === actor.groupIds.length && actor.groupIds.every((id) => requested.has(id));
      if (!unchanged) throw new ForbiddenException('No puedes cambiar tus propios roles');
    }

    const user = await this.prisma.sec_users.findUnique({ where: { login } });
    if (!user) throw new NotFoundException(`Usuario '${login}' no encontrado`);
    await this.assertCanAssignRoles(actor, login, groupIds);

    await this.prisma.sec_users_groups.deleteMany({ where: { login } });

    if (groupIds.length > 0) {
      await this.prisma.sec_users_groups.createMany({
        data: groupIds.map(id => ({ login, group_id: id })),
      });
    }
    return { login, groupIds };
  }
}
