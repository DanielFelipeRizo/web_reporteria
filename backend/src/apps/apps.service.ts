import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Lista de módulos del sistema (fuente de verdad)
const SYSTEM_MODULES = [
  { app_name: 'ventas',               app_type: 'module', description: 'Módulo de Ventas/Transacciones' },
  { app_name: 'cierres',              app_type: 'module', description: 'Módulo de Cierres' },
  { app_name: 'reservas',             app_type: 'module', description: 'Módulo de Reservas' },
  { app_name: 'seguridad.usuarios',   app_type: 'security', description: 'Gestión de Usuarios' },
  { app_name: 'seguridad.roles',      app_type: 'security', description: 'Gestión de Roles' },
  { app_name: 'seguridad.aplicaciones', app_type: 'security', description: 'Gestión de Módulos/Aplicaciones' },
  { app_name: 'seguridad.auditoria',  app_type: 'security', description: 'Auditoría del sistema' },
];

@Injectable()
export class AppsService {
  constructor(private prisma: PrismaService) {}

  /** Lista todas las apps registradas en BD */
  findAll() {
    return this.prisma.sec_apps.findMany({ orderBy: { app_name: 'asc' } });
  }

  /** Lista solo los módulos del nuevo sistema */
  findSystemModules() {
    return SYSTEM_MODULES;
  }

  /**
   * Sincroniza los módulos del sistema en sec_apps.
   * Crea los que no existen, no modifica los que ya están.
   */
  async syncModules() {
    const results: { app_name: string; status: 'created' | 'already_exists' }[] = [];

    for (const mod of SYSTEM_MODULES) {
      const exists = await this.prisma.sec_apps.findUnique({
        where: { app_name: mod.app_name },
      });

      if (!exists) {
        await this.prisma.sec_apps.create({ data: mod });
        results.push({ app_name: mod.app_name, status: 'created' });
      } else {
        results.push({ app_name: mod.app_name, status: 'already_exists' });
      }
    }

    return {
      message: `Sincronización completada`,
      total: SYSTEM_MODULES.length,
      created: results.filter(r => r.status === 'created').length,
      details: results,
    };
  }

  /** Elimina una app por nombre */
  remove(appName: string) {
    return this.prisma.sec_apps.delete({ where: { app_name: appName } });
  }
}
