import { Module } from '@nestjs/common';
import { TenantsController } from './controllers/tenants.controller';
import { UsersController } from './controllers/users.controller';
import { AuditLogsController } from './controllers/audit-logs.controller';
import { TenantsService } from './services/tenants.service';
import { UsersService } from './services/users.service';
import { AuditLogsService } from './services/audit-logs.service';

@Module({
    controllers: [TenantsController, UsersController, AuditLogsController],
    providers: [TenantsService, UsersService, AuditLogsService],
    exports: [TenantsService, UsersService, AuditLogsService],
})
export class AdminModule { }
