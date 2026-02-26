import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app/app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { Reflector } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:4200',
    credentials: true,
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors (順序重要: 上から順に実行)
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    app.get(TenantInterceptor),
    app.get(AuditInterceptor),
    new ResponseInterceptor(),
  );

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
  Logger.log(`🚀 API running on http://localhost:${port}/api`);
}

bootstrap();
