import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';

// Mapa de métodos HTTP → acciones de auditoría
const METHOD_ACTION_MAP: Record<string, string> = {
  GET: 'access',
  POST: 'insert',
  PATCH: 'update',
  PUT: 'update',
  DELETE: 'delete',
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;

    // Solo auditar peticiones autenticadas
    if (!user?.sub) return next.handle();

    const action = METHOD_ACTION_MAP[request.method] ?? 'access';

    // Extraer la sección del path: /users/john → "users"
    const pathParts = request.path.replace(/^\//, '').split('/');
    const application = pathParts[0] ?? 'unknown';

    // Obtener IP del cliente
    const ip =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      request.ip ??
      'unknown';

    return next.handle().pipe(
      tap(async () => {
        try {
          await this.prisma.sc_log.create({
            data: {
              inserted_date: new Date(),
              username: user.sub,
              application,
              action,
              ip_user: ip,
              creator: 'WebReporteriaAPI',
              description: `${request.method} ${request.path}`,
            },
          });
        } catch {
          // No interrumpir el flujo si falla la auditoría
        }
      }),
    );
  }
}
