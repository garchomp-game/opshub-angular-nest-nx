import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TenantsController } from './controllers/tenants.controller';
import { UsersController } from './controllers/users.controller';
import { AuditLogsController } from './controllers/audit-logs.controller';
import { TenantsService } from './services/tenants.service';
import { UsersService } from './services/users.service';
import { AuditLogsService } from './services/audit-logs.service';
import { ExportService } from './services/export.service';
import { ExportProcessor } from './processors/export.processor';

@Module({
    imports: [
        BullModule.registerQueue({ name: 'tenant-export' }),
    ],
    controllers: [TenantsController, UsersController, AuditLogsController],
    providers: [TenantsService, UsersService, AuditLogsService, ExportService, ExportProcessor],
    exports: [TenantsService, UsersService, AuditLogsService, ExportService],
})
export class AdminModule { }
