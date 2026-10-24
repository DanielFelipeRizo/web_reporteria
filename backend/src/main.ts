import 'dotenv/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { PrismaService } from './prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { appValidationPipe } from './common/pipes/app-validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Guards y Auditoría globales ──────────────────────────────────────────
  const reflector = app.get(Reflector);
  const jwtService = app.get(JwtService);
  const prismaService = app.get(PrismaService);

  // El JWT Guard actúa como portero en TODOS los endpoints
  app.useGlobalGuards(new JwtAuthGuard(jwtService, reflector));
  // El Audit Interceptor registra en sc_log TODA petición autenticada
  app.useGlobalInterceptors(new AuditInterceptor(prismaService));
  // Valida los cuerpos tipados con DTOs (responde 400 en vez de 500)
  app.useGlobalPipes(appValidationPipe);

  // ── Swagger ─────────────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Web Reportería API')
    .setDescription('API backend para Web Reportería')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // ── CORS ─────────────────────────────────────────────────────────────────
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Servidor corriendo en: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`📖 Swagger disponible en: http://localhost:${process.env.PORT ?? 3000}/api/docs`);
}
bootstrap();
