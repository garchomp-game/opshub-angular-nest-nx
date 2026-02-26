export { PrismaService } from './lib/prisma.service';
export { PrismaModule } from './lib/prisma.module';
export { tenantStore, TenantContext, applyTenantFilter, TENANT_MODELS } from './lib/middleware/tenant.middleware';
export { enforceAuditLogAppendOnly } from './lib/middleware/audit-log.middleware';
