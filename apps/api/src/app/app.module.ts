import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from '@prisma-db';

// Auth
import { AuthModule } from '../modules/auth/auth.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

// Admin
import { AdminModule } from '../modules/admin/admin.module';

// Feature Modules
import { TimesheetsModule } from '../modules/timesheets/timesheets.module';
import { WorkflowsModule } from '../modules/workflows/workflows.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { ExpensesModule } from '../modules/expenses/expenses.module';
import { ProjectsModule } from '../modules/projects/projects.module';
import { InvoicesModule } from '../modules/invoices/invoices.module';
import { SearchModule } from '../modules/search/search.module';
import { DocumentsModule } from '../modules/documents/documents.module';
import { DashboardModule } from '../modules/dashboard/dashboard.module';

// Operations
import { HealthModule } from '../modules/health/health.module';

// Mail
import { MailModule } from '../modules/mail/mail.module';

// Interceptors (for DI)
import { TenantInterceptor } from '../common/interceptors/tenant.interceptor';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';

// Cache
import { CacheEvictService } from '../common/services/cache-evict.service';

// Workers
import { WorkerService } from '../common/workers/worker.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => {
        const host = process.env['REDIS_HOST'] || 'localhost';
        const port = process.env['REDIS_PORT'] || '6379';
        return {
          stores: [createKeyv(`redis://${host}:${port}`)],
          ttl: 60_000, // default 60s
        };
      },
    }),
    BullModule.forRoot({
      connection: {
        host: process.env['REDIS_HOST'] || 'localhost',
        port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        retryStrategy: (times: number) => Math.min(times * 200, 3000),
      },
    }),
    ThrottlerModule.forRoot(
      process.env['THROTTLE_SKIP'] === 'true'
        ? [{ ttl: 60000, limit: 999999 }]
        : [
          {
            name: 'short',
            ttl: 1000,    // 1秒
            limit: parseInt(process.env['THROTTLE_SHORT_LIMIT'] || '3', 10),
          },
          {
            name: 'medium',
            ttl: 10000,   // 10秒
            limit: parseInt(process.env['THROTTLE_MEDIUM_LIMIT'] || '20', 10),
          },
          {
            name: 'long',
            ttl: 60000,   // 1分
            limit: parseInt(process.env['THROTTLE_LONG_LIMIT'] || '100', 10),
          },
        ],
    ),
    LoggerModule.forRoot({
      pinoHttp: {
        autoLogging: true,
        transport: process.env['NODE_ENV'] !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
          : undefined,
        level: process.env['LOG_LEVEL'] ?? 'info',
      },
    }),
    PrismaModule,
    AuthModule,
    AdminModule,
    HealthModule,
    TimesheetsModule,
    WorkflowsModule,
    NotificationsModule,
    ExpensesModule,
    ProjectsModule,
    InvoicesModule,
    SearchModule,
    DocumentsModule,
    DashboardModule,
    MailModule,
  ],
  providers: [
    // Global Guards (全エンドポイントに適用)
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Interceptors registered as providers for DI in main.ts
    TenantInterceptor,
    AuditInterceptor,
    // Cache eviction service (global)
    CacheEvictService,
    // Worker thread service (global)
    WorkerService,
  ],
  exports: [CacheEvictService, WorkerService],
})
export class AppModule { }
