import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { AppsModule } from './apps/apps.module';
import { AuditModule } from './audit/audit.module';
import { VentasModule } from './ventas/ventas.module';
import { CierresModule } from './cierres/cierres.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, RolesModule, AppsModule, AuditModule, VentasModule, CierresModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
