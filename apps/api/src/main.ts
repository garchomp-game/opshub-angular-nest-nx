import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app/app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // nestjs-pino が NestJS 内部のロガーを置き換え
  app.useLogger(app.get(Logger));

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
  // ※ nestjs-pino が HTTP リクエストログを自動記録するため LoggingInterceptor は不要
  app.useGlobalInterceptors(
    app.get(TenantInterceptor),
    app.get(AuditInterceptor),
    new ResponseInterceptor(),
  );

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
  const logger = app.get(Logger);
  logger.log(`🚀 API running on http://localhost:${port}/api`);
}

bootstrap();
