import { NestFactory } from '@nestjs/core';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as cluster from 'node:cluster';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import fastifyHelmet from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';
import { AppModule } from './app/app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 1_048_576, // 1MB
    }),
    { bufferLogs: true },
  );

  // nestjs-pino が NestJS 内部のロガーを置き換え
  app.useLogger(app.get(Logger));

  // Security headers (Fastify plugin)
  await app.register(fastifyHelmet as any);

  // Multipart / file upload support
  await app.register(fastifyMultipart as any, {
    limits: {
      fileSize: 10_485_760, // 10MB
    },
  });

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
    new PerformanceInterceptor(),
    app.get(TenantInterceptor),
    app.get(AuditInterceptor),
    new ResponseInterceptor(),
  );

  // Swagger config
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
  await app.listen(port, '0.0.0.0');
  const logger = app.get(Logger);
  logger.log(`🚀 API worker ${process.pid} running on http://localhost:${port}/api`);
}

// ─── Cluster Mode ───
// CLUSTER_ENABLED=true かつ Node.js ランタイムの場合のみクラスタモードを有効化
// Bun は cluster モジュール未対応のため、本番では PM2 を推奨
const clusterEnabled =
  process.env['CLUSTER_ENABLED'] === 'true' &&
  typeof (cluster as any).isPrimary !== 'undefined';

if (clusterEnabled && (cluster as any).isPrimary) {
  const numWorkers = parseInt(process.env['CLUSTER_WORKERS'] || '', 10) || os.cpus().length;
  console.log(`🔄 Primary ${process.pid} forking ${numWorkers} workers...`);

  for (let i = 0; i < numWorkers; i++) {
    (cluster as any).fork();
  }

  (cluster as any).on('exit', (worker: any, code: number) => {
    console.warn(`⚠️ Worker ${worker.process.pid} exited (code: ${code}). Restarting...`);
    (cluster as any).fork();
  });
} else {
  bootstrap();
}
