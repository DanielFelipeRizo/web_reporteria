import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { UsersModule } from '../users/users.module';

@Module({
  // PermissionsGuard usa UsersService para leer los permisos actuales
  imports: [UsersModule],
  providers: [RolesService],
  controllers: [RolesController]
})
export class RolesModule {}
