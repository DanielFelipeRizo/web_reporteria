import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Actor } from '../permissions/permissions';

/** Usuario que hace la petición, cargado por PermissionsGuard */
export const CurrentActor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Actor => context.switchToHttp().getRequest().actor,
);
