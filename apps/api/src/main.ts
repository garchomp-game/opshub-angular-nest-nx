import { NestFactory } from '@nestjs/core';
import * as fs from 'node:fs';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app/app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import helmet from 'helmet';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // nestjs-pino が NestJS 内部のロガーを置き換え
  app.useLogger(app.get(Logger));

  // Security headers
  app.use(helmet());

  // Body size limits (nodebestpractices 6.14)
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

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

  // Swagger config (always available for spec generation)
  const config = new DocumentBuilder()
    .setTitle('OpsHub API')
    .setDescription('OpsHub バックエンド API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, config);

  // OpenAPI spec export mode
  if (process.env['GENERATE_OPENAPI'] === 'true') {
    fs.writeFileSync('libs/api-client/openapi.json', JSON.stringify(doc, null, 2));
    console.log('OpenAPI spec written to libs/api-client/openapi.json');
    process.exit(0);
  }

  // Swagger UI (開発モードのみ)
  if (process.env['NODE_ENV'] !== 'production') {
    SwaggerModule.setup('api/docs', app, doc);
  }

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
  const logger = app.get(Logger);
  logger.log(`🚀 API running on http://localhost:${port}/api`);
}

bootstrap();

