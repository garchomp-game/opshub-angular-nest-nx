import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
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

// Interceptors (for DI)
import { TenantInterceptor } from '../common/interceptors/tenant.interceptor';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
  providers: [
    // Global Guards (全エンドポイントに適用)
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    // Interceptors registered as providers for DI in main.ts
    TenantInterceptor,
    AuditInterceptor,
  ],
})
export class AppModule { }
